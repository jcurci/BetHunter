import type { CustomerInfo } from 'react-native-purchases';
import { ENTITLEMENT_ID } from './revenueCat';
import { useSubscriptionStore } from '../storage/subscriptionStore';
import { blockerModule } from '../infrastructure/native/blockerModule';

/**
 * Reconcilia o bloqueador de apostas com o estado da assinatura.
 *
 * O guard de expiração do App.tsx só reagia à transição `premium: true → false`
 * DENTRO da sessão. Quem abria o app com a assinatura já vencida caía no
 * paywall com a VPN de pé — o bloqueio continuava valendo para quem não estava
 * mais pagando, até a próxima janela do worker de enforcement.
 *
 * Regra que atravessa este arquivo inteiro: **na dúvida, mantém bloqueando**.
 * Derrubar a proteção exige uma negação positiva e confirmada; ausência de
 * informação (rede caída, RC não configurado, SDK em transição de login) nunca
 * derruba nada.
 */

/** Folga em cima do vencimento real, para a janela em que a renovação ainda não foi confirmada. */
const LEASE_GRACE_MS = 7 * 24 * 60 * 60 * 1000;

/** Entitlement sem data de expiração (vitalício): renova por um ano a cada vez que o app abre. */
const LIFETIME_LEASE_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Quanto tempo depois do vencimento uma assinatura marcada para renovar ainda
 * é tratada como "renovação em trânsito" em vez de "acabou".
 */
const RENEWAL_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * O RC dispara `isPremium:false` momentâneo durante transições de `logIn()`.
 * Nunca pausamos no primeiro `false` observado — só depois de reconfirmar.
 */
const PAUSE_CONFIRM_DELAY_MS = 3000;

let pendingPause: ReturnType<typeof setTimeout> | null = null;

function cancelPendingPause(): void {
  if (pendingPause) {
    clearTimeout(pendingPause);
    pendingPause = null;
  }
}

/**
 * Decide se vale manter a proteção mesmo sem entitlement ativo.
 *
 * Assimetria proposital com `isPremium`: ver o paywall por engano é um
 * incômodo, perder a proteção contra apostas por engano é o dano real. Então o
 * acesso ao conteúdo premium continua rígido e só o bloqueador é tolerante.
 *
 * Cobre a janela em que a loja ainda não processou a renovação automática.
 * Falha de cobrança com retentativa já é coberta pelo próprio RevenueCat, que
 * mantém `isActive: true` durante o grace period. Cancelamento deliberado não
 * cai aqui: `willRenew` vira `false` e `unsubscribeDetectedAt` é preenchido.
 */
export function isRenewalInFlight(info: CustomerInfo | null): boolean {
  const entitlement = info?.entitlements.all?.[ENTITLEMENT_ID];
  if (!entitlement || entitlement.isActive) return false;

  const renewing = entitlement.willRenew || entitlement.billingIssueDetectedAt != null;
  if (!renewing) return false;

  const expiredAt = entitlement.expirationDateMillis;
  if (expiredAt == null) return false;

  return Date.now() - expiredAt <= RENEWAL_WINDOW_MS;
}

/** Até quando a VPN pode continuar filtrando sem nova confirmação de premium. */
function computeLeaseUntil(info: CustomerInfo | null): number {
  const expiresAt = info?.entitlements.active?.[ENTITLEMENT_ID]?.expirationDateMillis;
  if (expiresAt == null) return Date.now() + LIFETIME_LEASE_MS;
  return expiresAt + LEASE_GRACE_MS;
}

/**
 * Reconcilia o bloqueador com o estado atual da assinatura. Idempotente e
 * barato — feito para ser chamado no boot e a cada volta ao foreground.
 *
 * Os métodos nativos por trás também são idempotentes (`pauseBlocking` e
 * `resumeBlocking` saem cedo quando o estado já bate), então chamadas repetidas
 * não custam nada.
 */
export function syncBlockerWithPremium(reason: string): void {
  const { isPremium, rcSynced, customerInfo } = useSubscriptionStore.getState();

  // Sem dado real do RevenueCat não há o que concluir. Mantém como está.
  if (!rcSynced) {
    if (__DEV__) console.log(`[BLOCKER GATE] ${reason}: ignorado (sem sync do RC)`);
    return;
  }

  if (isPremium) {
    cancelPendingPause();
    try {
      blockerModule()?.renewPremiumLease?.(computeLeaseUntil(customerInfo));
      blockerModule()?.resumeBlocking?.();
    } catch (e) {
      if (__DEV__) console.warn('[BLOCKER GATE] falha ao retomar bloqueio', e);
    }
    return;
  }

  if (isRenewalInFlight(customerInfo)) {
    if (__DEV__) console.log(`[BLOCKER GATE] ${reason}: renovação em trânsito — mantém bloqueando`);
    cancelPendingPause();
    return;
  }

  if (pendingPause) return;

  pendingPause = setTimeout(async () => {
    pendingPause = null;
    await useSubscriptionStore.getState().refresh();
    const confirmed = useSubscriptionStore.getState();

    if (confirmed.isPremium || !confirmed.rcSynced || isRenewalInFlight(confirmed.customerInfo)) {
      if (__DEV__) console.log('[BLOCKER GATE] pausa cancelada na reconfirmação');
      return;
    }

    if (__DEV__) console.log(`[BLOCKER GATE] ${reason}: sem assinatura — pausando bloqueio`);
    try {
      blockerModule()?.pauseBlocking?.();
    } catch (e) {
      if (__DEV__) console.warn('[BLOCKER GATE] falha ao pausar bloqueio', e);
    }
  }, PAUSE_CONFIRM_DELAY_MS);
}
