import Purchases, { CustomerInfo } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSubscriptionStore } from '../storage/subscriptionStore';
import { waitForRCSync } from '../utils/waitForRCSync';

const AFFILIATE_COUPON_KEY = '@bethunter_affiliate_coupon';
const DEFAULT_BUDGET_MS = 12000;
const SYNC_WAIT_MS = 3000;
const MIN_ATTEMPT_MS = 800;

/**
 * O customerInfo que a loja devolve na conclusão da compra costuma chegar antes
 * do RevenueCat sincronizar o entitlement com o servidor — checar isPremium uma
 * única vez ali trata assinante novo como não-assinante.
 *
 * Aqui a confirmação insiste dentro de um orçamento de tempo, alternando entre
 * esperar o push do listener (waitForRCSync) e forçar um getCustomerInfo
 * (refresh), até o entitlement aparecer ou o orçamento acabar. É a mesma
 * estratégia usada no boot (App.tsx) e no login.
 */
export async function waitForPremiumConfirmation(
  customerInfo?: CustomerInfo,
  { totalBudgetMs }: { totalBudgetMs?: number } = {},
): Promise<boolean> {
  const budgetMs = totalBudgetMs ?? DEFAULT_BUDGET_MS;
  const store = useSubscriptionStore.getState();

  if (customerInfo) {
    store.setFromCustomerInfo(customerInfo);
  } else {
    await store.refresh();
  }

  const deadline = Date.now() + budgetMs;
  while (!useSubscriptionStore.getState().isPremium && Date.now() < deadline) {
    const startedAt = Date.now();

    // waitForRCSync resolve em QUALQUER update do store, então uma escrita
    // qualquer pode devolver o controle na hora; o piso evita girar em falso.
    await waitForRCSync(Math.min(SYNC_WAIT_MS, deadline - startedAt));
    if (useSubscriptionStore.getState().isPremium) break;

    await useSubscriptionStore.getState().refresh();
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_ATTEMPT_MS) {
      await new Promise<void>((r) => setTimeout(r, MIN_ATTEMPT_MS - elapsed));
    }
  }

  const { isPremium } = useSubscriptionStore.getState();
  if (__DEV__) console.log('[PURCHASE] waitForPremiumConfirmation →', isPremium);
  return isPremium;
}

/**
 * Limpa os vestígios do fluxo de cupom depois que a assinatura é confirmada.
 * Falhas aqui não podem bloquear a navegação para a Home.
 */
export async function clearCouponArtifacts(): Promise<void> {
  try {
    await Purchases.setAttributes({ cupom_ativo: 'false' });
  } catch {}
  try {
    await AsyncStorage.removeItem(AFFILIATE_COUPON_KEY);
  } catch {}
}
