#import "PopPangHostAuth.h"
#import <React/RCTBridgeModule.h>

static PopPangAccessTokenProvider popPangAccessTokenProvider;

@implementation PopPangHostAuth

RCT_EXPORT_MODULE(PopPangHostAuth)

+ (void)setAccessTokenProvider:(PopPangAccessTokenProvider)provider
{
  @synchronized(self) {
    popPangAccessTokenProvider = [provider copy];
  }
}

RCT_EXPORT_METHOD(getAccessToken:(BOOL)forceRefresh
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  PopPangAccessTokenProvider provider;

  @synchronized(PopPangHostAuth.class) {
    provider = popPangAccessTokenProvider;
  }

  if (provider == nil) {
    reject(@"no_provider", @"호스트 앱이 Access Token 제공자를 설정하지 않았습니다.", nil);
    return;
  }

  provider(forceRefresh, ^(NSString *_Nullable accessToken) {
    if (accessToken.length > 0) {
      resolve(accessToken);
    } else {
      reject(@"login_required", @"로그인 정보가 없습니다. 다시 로그인해 주세요.", nil);
    }
  });
}

@end
