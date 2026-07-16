import { Platform } from 'react-native';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { ENV } from '../config/env';

const ENTITLEMENT_ID = 'Bethunter Premium';
const COUPON_OFFERING_ID = 'cupom_desconto';

let isConfigured = false;
let pendingCouponOffering = false;

export function markCouponApplied(): void {
  pendingCouponOffering = true;
}

export function clearPendingCoupon(): void {
  pendingCouponOffering = false;
}

/**
 * Define o atributo de cupom e força um fetch fresco dos offerings com
 * Targeting reavaliado. Deve ser chamado antes de navegar para o Paywall.
 *
 * `couponCode` vira o subscriber attribute `affiliate_coupon` na RevenueCat —
 * é dali que o backend extrai o cupom no webhook de INITIAL_PURCHASE, só
 * depois que a compra é confirmada (o vínculo com o afiliado não é criado
 * antes disso).
 */
export async function applyAndSyncCoupon(withCoupon: boolean, couponCode?: string): Promise<void> {
  await Purchases.setAttributes({
    cupom_ativo: withCoupon ? 'true' : 'false',
    affiliate_coupon: withCoupon && couponCode ? couponCode.toUpperCase() : '',
  });
  pendingCouponOffering = withCoupon;
  try {
    await Purchases.syncAttributesAndOfferingsIfNeeded();
    if (__DEV__) console.log('[REVENUECAT] syncAttributesAndOfferingsIfNeeded concluído');
  } catch (e) {
    if (__DEV__) console.warn('[REVENUECAT] syncAttributesAndOfferingsIfNeeded falhou — usando fallback por ID', e);
  }
}

function isValidRevenueCatApiKey(apiKey: string, platform: typeof Platform.OS): boolean {
  if (!apiKey) return false;
  if (apiKey.startsWith('test_')) return __DEV__;
  if (platform === 'ios') return apiKey.startsWith('appl_');
  if (platform === 'android') return apiKey.startsWith('goog_');
  return false;
}

export async function initRevenueCat(): Promise<void> {
  if (isConfigured) return;

  const apiKey =
    Platform.OS === 'ios' ? ENV.REVENUECAT_IOS_API_KEY : ENV.REVENUECAT_ANDROID_API_KEY;

  if (!isValidRevenueCatApiKey(apiKey, Platform.OS)) {
    const hint =
      Platform.OS === 'ios'
        ? 'EXPO_PUBLIC_REVENUECAT_IOS_API_KEY (appl_…)'
        : 'EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY (goog_…)';
    console.warn(
      `[REVENUECAT] Chave SDK inválida ou ausente (${Platform.OS}). ` +
        `Em Release/use loja, use ${hint}. configure() foi ignorado para evitar crash nativo com test_/vazia.`,
    );
    return;
  }

  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO);

  Purchases.configure({
    apiKey,
  });

  isConfigured = true;
}

export async function identifyUser(
  userId: string,
  attrs?: { email?: string; name?: string; phone?: string },
): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.logIn(userId);

  const setAttrs: Record<string, string> = {};
  if (attrs?.email) setAttrs.$email = attrs.email;
  if (attrs?.name) setAttrs.$displayName = attrs.name;
  if (attrs?.phone) setAttrs.$phoneNumber = attrs.phone;

  if (Object.keys(setAttrs).length > 0) {
    try {
      await Purchases.setAttributes(setAttrs);
    } catch (e) {
      if (__DEV__) console.warn('[REVENUECAT] setAttributes falhou', e);
    }
  }

  return customerInfo;
}

export async function logoutUser(): Promise<void> {
  await Purchases.logOut();
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export async function isPremium(): Promise<boolean> {
  const info = await Purchases.getCustomerInfo();
  return !!info.entitlements.active[ENTITLEMENT_ID];
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

/** Offering para `RevenueCatUI.Paywall`: prioriza cupom pendente → Targeting (.current) → ID do ENV. */
export async function getPaywallOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();

  if (pendingCouponOffering) {
    const coupon = offerings.all[COUPON_OFFERING_ID];
    if (coupon) {
      pendingCouponOffering = false;
      if (__DEV__) console.log('[REVENUECAT] ✅ OFFERING CARREGADO: cupom_desconto —', coupon.serverDescription);
      return coupon;
    }
    // offering ainda não propagou no RevenueCat — mantém flag para próxima tentativa
    if (__DEV__) console.warn('[REVENUECAT] ⚠️ Offering cupom_desconto NÃO encontrado em offerings.all. Disponíveis:', Object.keys(offerings.all).join(', '));
  }

  // Fluxo padrão: ignora .current se ainda for o offering promocional (targeting residual)
  const current = offerings.current;
  if (current && current.identifier !== COUPON_OFFERING_ID) {
    if (__DEV__) console.log('[REVENUECAT] ✅ OFFERING CARREGADO: current —', current.identifier);
    return current;
  }

  const id = ENV.REVENUECAT_DEFAULT_OFFERING_IDENTIFIER;
  if (id) {
    const match = offerings.all[id];
    if (match) return match;
    if (__DEV__) {
      const keys = Object.keys(offerings.all).join(', ');
      console.warn(`[REVENUECAT] Offering "${id}" não encontrado em offerings.all (${keys || 'vazio'}).`);
    }
  }

  // Último recurso: retorna current mesmo que seja o cupom (melhor que null)
  return current ?? null;
}

export async function purchasePackage(
  pkg: PurchasesPackage,
): Promise<{ success: boolean; customerInfo: CustomerInfo | null; cancelled: boolean }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    return { success: active, customerInfo, cancelled: false };
  } catch (e: any) {
    if (e.userCancelled) {
      return { success: false, customerInfo: null, cancelled: true };
    }
    throw e;
  }
}

export async function restorePurchases(): Promise<{ success: boolean; customerInfo: CustomerInfo }> {
  const customerInfo = await Purchases.restorePurchases();
  const active = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  return { success: active, customerInfo };
}

export { ENTITLEMENT_ID };
