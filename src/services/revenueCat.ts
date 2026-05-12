import { Platform } from 'react-native';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';
import { ENV } from '../config/env';

const ENTITLEMENT_ID = 'Bethunter Premium';

let isConfigured = false;

export async function initRevenueCat(): Promise<void> {
  if (isConfigured) return;

  const apiKey =
    Platform.OS === 'ios' ? ENV.REVENUECAT_IOS_API_KEY : ENV.REVENUECAT_ANDROID_API_KEY;

  if (!apiKey && __DEV__) {
    console.warn(
      `[REVENUECAT] Chave SDK em falta (${Platform.OS}). Defina EXPO_PUBLIC_REVENUECAT_${Platform.OS === 'ios' ? 'IOS' : 'ANDROID'}_API_KEY ou EXPO_PUBLIC_REVENUECAT_API_KEY.`,
    );
  }

  Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  Purchases.configure({
    apiKey,
  });

  isConfigured = true;
}

export async function identifyUser(userId: string): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.logIn(userId);
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

/** Offering para `RevenueCatUI.Paywall`: usa ENV ou `offerings.current`. */
export async function getPaywallOffering(): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();

  const id = ENV.REVENUECAT_DEFAULT_OFFERING_IDENTIFIER;
  if (id) {
    const match = offerings.all[id];
    if (match) return match;
    if (__DEV__) {
      const keys = Object.keys(offerings.all).join(', ');
      console.warn(
        `[REVENUECAT] Offering "${id}" não encontrado em offerings.all (${keys || 'vazio'}). A usar offerings.current.`,
      );
    }
  }
  return offerings.current ?? null;
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
