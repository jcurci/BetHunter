import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootStackParamList } from '../../types/navigation';
import { applyAndSyncCoupon } from '../../services/revenueCat';
import { AffiliateApi } from '../../infrastructure/services/Affiliate.api';
import {
  HORIZONTAL_GRADIENT_COLORS,
  HORIZONTAL_GRADIENT_LOCATIONS,
} from '../../config/colors';

const affiliateApi = new AffiliateApi();

const AFFILIATE_COUPON_KEY = '@bethunter_affiliate_coupon';

const CouponScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(AFFILIATE_COUPON_KEY).then((saved) => {
      if (saved) setCode(saved);
    }).catch(() => {});
  }, []);

  const handleApply = async () => {
    if (!code.trim() || loading || skipLoading) return;
    setLoading(true);
    setError(null);
    try {
      const result = await affiliateApi.validateCoupon(code.trim());
      if (!result.valid) {
        setError(result.message || 'Cupom inválido ou não encontrado.');
        return;
      }
      // Cupom válido: link + RC sync + save em paralelo (independentes entre si)
      let linkError: unknown = null;
      await Promise.all([
        affiliateApi.linkCoupon(code.trim()).catch((e) => { linkError = e; }),
        applyAndSyncCoupon(true).catch((e) => {
          if (__DEV__) console.warn('[COUPON] applyAndSyncCoupon error', e);
        }),
        AsyncStorage.setItem(AFFILIATE_COUPON_KEY, code.trim()).catch(() => {}),
      ]);
      if (linkError) {
        const status = (linkError as any)?.response?.status;
        if (__DEV__) console.warn(`[COUPON] linkCoupon error (HTTP ${status})`, linkError);
        if (status === 401) {
          setError('Sessão expirada. Saia e entre novamente para aplicar o cupom.');
        } else if (status === 404) {
          setError('Cupom não encontrado no sistema. Contate o suporte.');
        } else if (status === 400) {
          setError('Cupom inativo ou já utilizado por outra conta.');
        } else {
          setError('Não foi possível vincular o cupom. Verifique sua conexão e tente novamente.');
        }
        return;
      }
      navigation.replace('Paywall');
    } catch (e: any) {
      if (__DEV__) console.warn('[COUPON] validateCoupon error', e);
      const status = e?.response?.status;
      if (status === 404) {
        setError('Cupom não encontrado. Verifique o código digitado.');
      } else if (status >= 400 && status < 500) {
        setError('Cupom inválido. Verifique o código e tente novamente.');
      } else {
        setError('Não foi possível validar o cupom. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (loading || skipLoading) return;
    setSkipLoading(true);
    try {
      await applyAndSyncCoupon(false);
    } catch (e) {
      if (__DEV__) console.warn('[COUPON] applyAndSyncCoupon(false) error', e);
    } finally {
      setSkipLoading(false);
    }
    navigation.replace('Paywall');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>🎟️</Text>
          <Text style={styles.title}>Tem um cupom?</Text>
          <Text style={styles.subtitle}>
            Digite seu código para obter um desconto especial
          </Text>

          <TextInput
            style={[styles.input, error !== null && styles.inputError]}
            placeholder="Digite o código"
            placeholderTextColor="#5A5568"
            autoCapitalize="characters"
            autoCorrect={false}
            value={code}
            onChangeText={(text) => { setCode(text.toUpperCase()); setError(null); }}
            editable={!loading && !skipLoading}
            returnKeyType="done"
            onSubmitEditing={handleApply}
          />

          {error !== null && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <TouchableOpacity
            onPress={() => void handleApply()}
            activeOpacity={0.85}
            disabled={loading || skipLoading || !code.trim()}
            style={styles.applyWrapper}
          >
            <LinearGradient
              colors={[...HORIZONTAL_GRADIENT_COLORS]}
              locations={[...HORIZONTAL_GRADIENT_LOCATIONS]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.applyButton,
                (!code.trim() || loading || skipLoading) && styles.applyButtonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.applyButtonText}>Aplicar cupom</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => void handleSkip()}
            disabled={loading || skipLoading}
            activeOpacity={0.7}
          >
            {skipLoading ? (
              <ActivityIndicator color="#8A8595" size="small" />
            ) : (
              <Text style={styles.skipButtonText}>Continuar sem cupom</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CouponScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0F',
  },
  inner: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 16,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#8A8595',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  input: {
    alignSelf: 'stretch',
    backgroundColor: '#16141F',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2B2737',
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 17,
    color: '#FFFFFF',
    letterSpacing: 2,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 4,
  },
  inputError: {
    borderColor: '#E05252',
  },
  errorText: {
    color: '#E05252',
    fontSize: 13,
    textAlign: 'center',
    marginTop: -8,
    paddingHorizontal: 8,
  },
  applyWrapper: {
    alignSelf: 'stretch',
  },
  applyButton: {
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonDisabled: {
    opacity: 0.45,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  skipButton: {
    paddingVertical: 10,
    marginTop: 4,
  },
  skipButtonText: {
    color: '#8A8595',
    fontSize: 14,
    fontWeight: '500',
  },
});
