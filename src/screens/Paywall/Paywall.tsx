import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import type { CustomerInfo, PurchasesOffering } from 'react-native-purchases';
import Icon from 'react-native-vector-icons/Feather';
import { useSubscriptionStore } from '../../storage/subscriptionStore';
import { useAuthStore } from '../../storage/authStore';
import type { RootStackParamList } from '../../types/navigation';
import { getPaywallOffering } from '../../services/revenueCat';
import { clearCouponArtifacts, waitForPremiumConfirmation } from '../../services/purchaseSettlement';
import { AppLoadingScreen } from '../../components/AppLoadingScreen';

/** De onde veio a tentativa de confirmação — muda só a mensagem de espera. */
type SettleSource = 'purchase' | 'restore';

const Paywall: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [settling, setSettling] = useState(false);
  const [confirmPending, setConfirmPending] = useState<SettleSource | null>(null);
  const isNavigatingRef = React.useRef(false);

  const finishAsSubscriber = useCallback(async (
    customerInfo?: CustomerInfo,
    source: SettleSource = 'purchase',
  ): Promise<void> => {
    if (__DEV__) console.log('[PAYWALL] finishAsSubscriber chamado — customerInfo recebido:', !!customerInfo);

    if (isNavigatingRef.current) {
      if (__DEV__) console.log('[PAYWALL] bloqueado por isNavigatingRef — duplo clique ignorado');
      return;
    }
    isNavigatingRef.current = true;
    // Antes de qualquer await: cobre o paywall com o loading no mesmo frame em
    // que a compra é concluída, e só sai dele na Home.
    setSettling(true);
    setConfirmPending(null);

    try {
      if (__DEV__ && customerInfo) {
        console.log('[PAYWALL] entitlements.active keys:', Object.keys(customerInfo.entitlements?.active ?? {}));
        console.log('[PAYWALL] originalAppUserId:', customerInfo.originalAppUserId);
      }

      // Restore de quem nunca comprou não tem o que sincronizar — não faz
      // sentido segurar o loading os 12 s do fluxo de compra.
      const confirmed = await waitForPremiumConfirmation(customerInfo, {
        totalBudgetMs: source === 'restore' ? 4000 : undefined,
      });
      if (!confirmed) {
        isNavigatingRef.current = false;
        setSettling(false);
        setConfirmPending(source);
        return;
      }

      await clearCouponArtifacts();
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch (err) {
      if (__DEV__) console.warn('[PAYWALL] erro em finishAsSubscriber:', err);
      isNavigatingRef.current = false;
      setSettling(false);
      setConfirmPending(source);
    }
  }, [navigation]);

  const handleLogout = useCallback(async () => {
    await useAuthStore.getState().logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }, [navigation]);

  // Safety net: if RevenueCat listener confirms premium while user is stuck on Paywall
  useEffect(() => {
    if (isPremium) {
      void finishAsSubscriber();
    }
  }, [isPremium, finishAsSubscriber]);

  const loadOffering = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const o = await getPaywallOffering();
      if (o === null) {
        setError('Não foi possível carregar os planos. Tente novamente.');
        setLoading(false);
        return;
      }

      if (Platform.OS === 'android') {
        const result = await RevenueCatUI.presentPaywall({
          displayCloseButton: true,
          offering: o,
        });
        if (__DEV__) console.log('[PAYWALL-ANDROID] presentPaywall result:', result);
        if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
          setCancelled(false);
          await finishAsSubscriber(
            undefined,
            result === PAYWALL_RESULT.RESTORED ? 'restore' : 'purchase',
          );
        } else if (result === PAYWALL_RESULT.ERROR) {
          setCancelled(false);
          setError('Ocorreu um erro ao processar. Tente novamente.');
          setLoading(false);
        } else {
          // CANCELLED — usuário fechou o modal voluntariamente
          setCancelled(true);
          setLoading(false);
        }
        return;
      }

      // iOS: embedded PaywallView via SwiftUI — não afetado pela interop Fabric
      setOffering(o);
      setLoading(false);
    } catch (e: unknown) {
      if (__DEV__) console.warn('[PAYWALL] erro ao carregar offering:', e);
      setError('Não foi possível carregar os planos. Verifique sua conexão e tente novamente.');
      setLoading(false);
    }
  }, [finishAsSubscriber]);

  useEffect(() => {
    void loadOffering();
  }, [loadOffering]);

  // Compra concluída: loading de tela cheia até o reset para a Home — a Home
  // continua com o mesmo AppLoadingScreen enquanto carrega, sem piscar.
  if (settling) {
    return <AppLoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {confirmPending !== null ? (
        <View style={styles.centered}>
          <Icon name="clock" size={40} color="#D783D8" style={{ marginBottom: 16 }} />
          <Text style={styles.blockerTitle}>
            {confirmPending === 'purchase' ? 'Confirmando sua assinatura' : 'Assinatura não encontrada'}
          </Text>
          <Text style={styles.blockerSubtitle}>
            {confirmPending === 'purchase'
              ? 'Recebemos seu pagamento, mas a loja ainda está sincronizando a assinatura. Isso costuma levar alguns instantes.'
              : 'Não encontramos uma assinatura ativa nesta conta. Verifique se está usando a conta correta na loja e tente novamente.'}
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              const source = confirmPending;
              setConfirmPending(null);
              void finishAsSubscriber(undefined, source);
            }}
          >
            <Text style={styles.retryBtnText}>Verificar novamente</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutLink} onPress={() => void handleLogout()}>
            <Text style={styles.logoutLinkText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D783D8" />
        </View>
      ) : cancelled ? (
        <View style={styles.centered}>
          <Icon name="lock" size={40} color="#D783D8" style={{ marginBottom: 16 }} />
          <Text style={styles.blockerTitle}>Acesso exclusivo para assinantes</Text>
          <Text style={styles.blockerSubtitle}>
            Assine o BetHunter Premium para ter acesso completo ao app.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => { setCancelled(false); void loadOffering(); }}
          >
            <Text style={styles.retryBtnText}>Ver planos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutLink} onPress={() => void handleLogout()}>
            <Text style={styles.logoutLinkText}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      ) : error !== null || offering === null ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error ?? 'Planos indisponíveis.'}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void loadOffering()}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <RevenueCatUI.Paywall
          options={{ offering }}
          onPurchaseCompleted={async ({ customerInfo }) => {
            if (__DEV__) console.log('[PAYWALL] onPurchaseCompleted disparado');
            await finishAsSubscriber(customerInfo);
          }}
          onRestoreCompleted={async ({ customerInfo }) => {
            if (__DEV__) console.log('[PAYWALL] onRestoreCompleted disparado');
            await finishAsSubscriber(customerInfo, 'restore');
          }}
          onRestoreStarted={() => {
            if (__DEV__) console.log('[PAYWALL] onRestoreStarted — restore iniciado pelo SDK');
          }}
          onRestoreError={({ error: restoreError }) => {
            if (__DEV__) console.warn('[PAYWALL] onRestoreError:', restoreError.message);
            Alert.alert(
              'Erro ao restaurar',
              'Não foi possível restaurar sua assinatura. Verifique sua conexão e tente novamente.',
            );
          }}
          onPurchaseError={({ error: purchaseError }) => {
            if (__DEV__) console.warn('[PAYWALL] onPurchaseError:', purchaseError.message);
            Alert.alert(
              'Erro na compra',
              'Não foi possível processar a compra. Verifique sua conexão e tente novamente.',
            );
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default Paywall;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#B8B3BF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#2F2A3E',
    borderRadius: 14,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  blockerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  blockerSubtitle: {
    color: '#B8B3BF',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  logoutLink: {
    marginTop: 16,
    paddingVertical: 8,
  },
  logoutLinkText: {
    color: '#8A8595',
    fontSize: 14,
    fontWeight: '500',
  },
});
