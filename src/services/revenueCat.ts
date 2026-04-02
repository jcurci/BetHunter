import { Platform } from 'react-native';
import Purchases, {
  PurchasesOffering,
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases';

const API_KEY = 'test_XRnfEBeCyBAiAckEbLAdYxjECkJ';
const ENTITLEMENT_ID = 'Bethunter Premium';

let isConfigured = false;

export async function initRevenueCat(): Promise<void> {
  if (isConfigured) return;

  Purchases.setLogLevel(LOG_LEVEL.DEBUG);

  Purchases.configure({
    apiKey: API_KEY,
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
