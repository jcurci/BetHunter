import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import RevenueCatUI from 'react-native-purchases-ui';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { HORIZONTAL_GRADIENT_COLORS, HORIZONTAL_GRADIENT_LOCATIONS } from '../../../config/colors';
import type { RootStackParamList } from '../../../types/navigation';
import { restorePurchases } from '../../../services/revenueCat';
import { useSubscriptionStore } from '../../../storage/subscriptionStore';
import { setOnboardingFlowCompleted } from '../onboardingStorage';

type Props = {
  currentStep: number;
  totalSteps: number;
  onComplete: () => void;
  onBack: () => void;
};

const FEATURES = [
  { icon: 'shield', text: 'Bloqueio de casas de apostas' },
  { icon: 'activity', text: 'Proteção anti-recaída' },
  { icon: 'trending-up', text: 'Acompanhamento de progresso' },
  { icon: 'heart', text: 'Modo meditação ilimitado' },
  { icon: 'award', text: 'Quiz educacional completo' },
];

export const PaywallScreen: React.FC<Props> = ({
  currentStep,
  totalSteps,
  onComplete,
  onBack,
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [showingPaywall, setShowingPaywall] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const refresh = useSubscriptionStore((s) => s.refresh);

  /** Só em desenvolvimento: pular paywall e ir à Home para testar o app */
  const handleTestGoHome = async () => {
    await setOnboardingFlowCompleted();
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const progress = (currentStep + 1) / totalSteps;

  const handlePurchase = async () => {
    setShowingPaywall(true);
  };

  /** Compra ou restauração válida: onboarding concluído e Home. */
  const finishAsSubscriber = async (): Promise<void> => {
    await refresh();
    await setOnboardingFlowCompleted();
    setShowingPaywall(false);
    navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
  };

  const handleRestore = async () => {
    try {
      setRestoring(true);
      const { success } = await restorePurchases();
      await refresh();
      if (success) {
        Alert.alert('Sucesso', 'Assinatura restaurada com sucesso!', [
          { text: 'OK', onPress: () => void finishAsSubscriber() },
        ]);
      } else {
        Alert.alert('Nenhuma assinatura', 'Não encontramos nenhuma assinatura ativa.');
      }
    } catch {
      Alert.alert('Erro', 'Não foi possível restaurar. Tente novamente.');
    } finally {
      setRestoring(false);
    }
  };

  if (showingPaywall) {
    return (
      <RevenueCatUI.Paywall
        onDismiss={() => setShowingPaywall(false)}
        onPurchaseCompleted={async () => {
          await finishAsSubscriber();
        }}
        onRestoreCompleted={async () => {
          await finishAsSubscriber();
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.progressBarBackground}>
          <LinearGradient
            colors={[...HORIZONTAL_GRADIENT_COLORS]}
            locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: progress, borderRadius: 999 }}
          />
          <View style={{ flex: 1 - progress }} />
        </View>

        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Text style={styles.backText}>Voltar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Icon name="star" size={32} color="#FFD866" />
          </View>

          <Text style={styles.title}>Comece a retomar o controle hoje</Text>
          <Text style={styles.subtitle}>Bethunter Premium</Text>

          <View style={styles.featuresCard}>
            {FEATURES.map((feat) => (
              <View key={feat.text} style={styles.featureRow}>
                <Icon name={feat.icon} size={18} color="#7456C8" />
                <Text style={styles.featureText}>{feat.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>A partir de</Text>
            <Text style={styles.priceValue}>R$ 19,90/mês</Text>
          </View>
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handlePurchase} activeOpacity={0.9}>
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaButton}
            >
              <Text style={styles.ctaButtonText}>Começar minha recuperação</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.secondaryRow}>
            <TouchableOpacity onPress={handleRestore} activeOpacity={0.7} disabled={restoring}>
              {restoring ? (
                <ActivityIndicator size="small" color="#8A8595" />
              ) : (
                <Text style={styles.secondaryLink}>Restaurar compra</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={onComplete} activeOpacity={0.7}>
              <Text style={styles.secondaryLink}>Continuar grátis</Text>
            </TouchableOpacity>
          </View>

          {__DEV__ && (
            <TouchableOpacity
              onPress={handleTestGoHome}
              activeOpacity={0.8}
              style={styles.testHomeButton}
            >
              <Text style={styles.testHomeText}>Teste: ir para Home</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  progressBarBackground: {
    height: 4,
    borderRadius: 999,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: '#2A2435',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2A1A35',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#D783D8',
    fontWeight: '600',
    marginBottom: 28,
  },
  featuresCard: {
    width: '100%',
    backgroundColor: '#16141F',
    borderRadius: 16,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderColor: '#2B2737',
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#C7C3D1',
    flex: 1,
  },
  priceCard: {
    backgroundColor: '#16141F',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2B2737',
  },
  priceLabel: {
    fontSize: 12,
    color: '#8A8595',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bottomBar: {
    paddingBottom: 36,
    paddingTop: 12,
  },
  ctaButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  secondaryLink: {
    fontSize: 14,
    color: '#8A8595',
  },
  testHomeButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4A4458',
    backgroundColor: '#16141F',
  },
  testHomeText: {
    fontSize: 13,
    color: '#B8A8E8',
    fontWeight: '600',
  },
});
