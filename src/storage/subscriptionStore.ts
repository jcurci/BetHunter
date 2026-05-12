import { create } from 'zustand';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { ENTITLEMENT_ID } from '../services/revenueCat';

type SubscriptionState = {
  isPremium: boolean;
  isInitialized: boolean;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setFromCustomerInfo: (info: CustomerInfo) => void;
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  isInitialized: false,
  customerInfo: null,
  loading: true,

  refresh: async () => {
    try {
      set({ loading: true });
      const info = await Purchases.getCustomerInfo();
      const isPremium = !!info.entitlements.active[ENTITLEMENT_ID];
      if (__DEV__) console.log('[SUBSCRIPTION] refresh() → isPremium:', isPremium, 'entitlements:', Object.keys(info.entitlements.active));
      set({ isPremium, customerInfo: info, loading: false, isInitialized: true });
    } catch (e) {
      if (__DEV__) console.warn('[REVENUECAT] getCustomerInfo failed', e);
      set({ loading: false, isInitialized: true });
    }
  },

  setFromCustomerInfo: (info: CustomerInfo) => {
    const isPremium = !!info.entitlements.active[ENTITLEMENT_ID];
    set({ isPremium, customerInfo: info, loading: false, isInitialized: true });
  },
}));

export function setupCustomerInfoListener(): () => void {
  const listener = (info: CustomerInfo) => {
    const isPremium = !!info.entitlements.active[ENTITLEMENT_ID];
    if (__DEV__) console.log('[SUBSCRIPTION] listener fired → isPremium:', isPremium);
    useSubscriptionStore.setState({
      isPremium,
      customerInfo: info,
      loading: false,
      isInitialized: true,
    });
  };

  Purchases.addCustomerInfoUpdateListener(listener);

  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}
