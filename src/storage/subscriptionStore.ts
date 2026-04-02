import { create } from 'zustand';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { ENTITLEMENT_ID } from '../services/revenueCat';

type SubscriptionState = {
  isPremium: boolean;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  customerInfo: null,
  loading: true,

  refresh: async () => {
    try {
      set({ loading: true });
      const info = await Purchases.getCustomerInfo();
      set({
        isPremium: !!info.entitlements.active[ENTITLEMENT_ID],
        customerInfo: info,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));

export function setupCustomerInfoListener(): () => void {
  const listener = (info: CustomerInfo) => {
    useSubscriptionStore.setState({
      isPremium: !!info.entitlements.active[ENTITLEMENT_ID],
      customerInfo: info,
    });
  };

  Purchases.addCustomerInfoUpdateListener(listener);

  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}
