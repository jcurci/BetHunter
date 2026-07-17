import { NativeModules, Platform } from 'react-native';
import { ENV } from '../../config/env';

function nativeBlockerModule() {
  return Platform.OS === 'android' ? NativeModules.BetBlocker : NativeModules.BetBlocking;
}

/**
 * Sincroniza o token de auth com o lado nativo (Android/iOS), pra que o worker
 * de enforcement de assinatura em background consiga chamar nosso backend sem
 * depender do app JS estar aberto.
 */
export function syncAuthSessionToNative(token: string): void {
  try {
    nativeBlockerModule()?.syncAuthSession?.(token, ENV.API_BASE_URL);
  } catch (e) {
    if (__DEV__) console.warn('[authSessionBridge] syncAuthSession failed', e);
  }
}

export function clearAuthSessionFromNative(): void {
  try {
    nativeBlockerModule()?.clearAuthSession?.();
  } catch (e) {
    if (__DEV__) console.warn('[authSessionBridge] clearAuthSession failed', e);
  }
}
