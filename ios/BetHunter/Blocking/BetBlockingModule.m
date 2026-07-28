#import <React/RCTBridgeModule.h>

// IMPORTANTE: todo `@objc func` de BetBlockingModule.swift precisa de um
// RCT_EXTERN_METHOD correspondente aqui. Um método implementado no Swift mas
// ausente desta lista simplesmente não existe para o JS — e como
// authSessionBridge.ts usa optional chaining (`?.syncAuthSession?.()`), a chamada
// some em silêncio, sem warning nenhum.
//
// Foi assim que syncAuthSession/clearAuthSession ficaram mortos: implementados no
// Swift no commit 189a8a53 e nunca exportados. Consequência: AppGroupHelper.apiBaseUrl
// e o JWT no Keychain nunca eram gravados, e SubscriptionEnforcementTask caía no
// guard em toda execução — o enforcement de assinatura no iOS nunca rodou.
//
// scripts/check-rn-bridge.sh verifica essa correspondência no CI.

@interface RCT_EXTERN_MODULE(BetBlocking, NSObject)

// Fluxo de ativação
RCT_EXTERN_METHOD(openBlockingFlow)
RCT_EXTERN_METHOD(stopBlocking)
RCT_EXTERN_METHOD(pauseBlocking)
RCT_EXTERN_METHOD(resumeBlocking)
RCT_EXTERN_METHOD(renewPremiumLease:(nonnull NSNumber *)untilMs)
RCT_EXTERN_METHOD(openVpnSettings)

// Sessão de auth (usada pelo enforcement em background)
RCT_EXTERN_METHOD(syncAuthSession:(NSString *)token apiBaseUrl:(NSString *)apiBaseUrl)
RCT_EXTERN_METHOD(clearAuthSession)

// Kill switch remoto
RCT_EXTERN_METHOD(setTunnelEnabled:(BOOL)enabled)

// Estado
RCT_EXTERN_METHOD(isBlockingEnabled:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getProtectionStatus:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(checkAndSyncBlockingStatus:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(refreshBlockedDomains:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
