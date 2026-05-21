import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';
import type { PurchasesOffering } from 'react-native-purchases';
import { useSubscriptionStore } from '../../storage/subscriptionStore';
import type { RootStackParamList } from '../../types/navigation';
import { getPaywallOffering } from '../../services/revenueCat';

const Paywall: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const refresh = useSubscriptionStore((s) => s.refresh);
  const isPremium = useSubscriptionStore((s) => s.isPremium);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const finishAsSubscriber = async (): Promise<void> => {
    await refresh();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  // Safety net: if RevenueCat listener confirms premium while user is stuck on Paywall
  useEffect(() => {
    if (isPremium) {
      void finishAsSubscriber();
    }
  }, [isPremium]);

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
        console.log('[PAYWALL-ANDROID] offering.identifier:', o.identifier);
        console.log('[PAYWALL-ANDROID] offering.serverDescription:', o.serverDescription);
        console.log('[PAYWALL-ANDROID] availablePackages count:', o.availablePackages.length);
        console.log('[PAYWALL-ANDROID] metadata keys:', Object.keys(o.metadata ?? {}));
        // paywall property exists in V2 offerings serialized from native
        console.log('[PAYWALL-ANDROID] paywall (V2 template):', JSON.stringify((o as any).paywall ?? null));

        const result = await RevenueCatUI.presentPaywall({
          displayCloseButton: true,
          offering: o,
        });
        console.log('[PAYWALL-ANDROID] presentPaywall result:', result);
        if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
          await finishAsSubscriber();
        } else {
          // Paywall is a hard gate — no goBack(). Reload the offering so the user can try again.
          setLoading(true);
          void loadOffering();
        }
        return;
      }

      // iOS: embedded PaywallView via SwiftUI — não afetado pela interop Fabric
      setOffering(o);
      setLoading(false);
    } catch (e: unknown) {
      const msg =
        e instanceof Error && e.message.trim()
          ? e.message
          : 'Erro ao carregar o paywall.';
      setError(msg);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOffering();
  }, [loadOffering]);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D783D8" />
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
          onPurchaseCompleted={async () => {
            await finishAsSubscriber();
          }}
          onRestoreCompleted={async () => {
            await finishAsSubscriber();
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
});
