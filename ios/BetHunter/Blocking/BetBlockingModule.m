#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(BetBlocking, NSObject)

RCT_EXTERN_METHOD(openBlockingFlow)
RCT_EXTERN_METHOD(stopBlocking)
RCT_EXTERN_METHOD(isBlockingEnabled:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
