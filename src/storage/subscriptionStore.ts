import { create } from 'zustand';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { ENTITLEMENT_ID } from '../services/revenueCat';
import { useAuthStore } from './authStore';

const RC_ANONYMOUS_PREFIX = '$RCAnonymousID:';

/**
 * Premium exige entitlement ativo E que o customer do RevenueCat pertença ao
 * usuário logado: originalAppUserId anônimo (merge normal do logIn) ou igual ao
 * id da conta. Um id de OUTRA conta indica entitlement herdado por alias/
 * transferência (ex.: restore num aparelho cuja loja tem assinatura de outra
 * conta) — não libera premium.
 */
function computeIsPremium(info: CustomerInfo): boolean {
  const active = !!info.entitlements.active[ENTITLEMENT_ID];
  if (!active) return false;

  const original = info.originalAppUserId;
  const currentId = useAuthStore.getState().user?.id;
  if (!original || original.startsWith(RC_ANONYMOUS_PREFIX) || !currentId) {
    return true;
  }

  const owned = original === String(currentId);
  if (!owned && __DEV__) {
    console.warn(
      `[SUBSCRIPTION] entitlement ativo pertence a outro app_user (originalAppUserId=${original}, logado=${currentId}) — premium negado`,
    );
  }
  return owned;
}

type SubscriptionState = {
  isPremium: boolean;
  isInitialized: boolean;
  customerInfo: CustomerInfo | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setFromCustomerInfo: (info: CustomerInfo) => void;
};

let _refreshInFlight: Promise<void> | null = null;

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPremium: false,
  isInitialized: false,
  customerInfo: null,
  loading: true,

  refresh: async () => {
    if (_refreshInFlight) return _refreshInFlight;

    set({ loading: true });
    _refreshInFlight = (async () => {
      try {
        const info = await Purchases.getCustomerInfo();
        const isPremium = computeIsPremium(info);
        if (__DEV__) {
          console.log('[SUBSCRIPTION] refresh() — originalAppUserId:', info.originalAppUserId);
          console.log('[SUBSCRIPTION] refresh() — entitlements.active keys:', Object.keys(info.entitlements.active));
          console.log('[SUBSCRIPTION] refresh() — ENTITLEMENT_ID buscado:', ENTITLEMENT_ID);
          console.log('[SUBSCRIPTION] refresh() — isPremium:', isPremium);
        }
        set({ isPremium, customerInfo: info, loading: false, isInitialized: true });
      } catch (e) {
        if (__DEV__) console.warn('[SUBSCRIPTION] refresh() — getCustomerInfo falhou:', e);
        set({ loading: false, isInitialized: true });
      } finally {
        _refreshInFlight = null;
      }
    })();

    return _refreshInFlight;
  },

  setFromCustomerInfo: (info: CustomerInfo) => {
    const isPremium = computeIsPremium(info);
    set({ isPremium, customerInfo: info, loading: false, isInitialized: true });
  },
}));

export function setupCustomerInfoListener(): () => void {
  const listener = (info: CustomerInfo) => {
    const isPremium = computeIsPremium(info);
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
