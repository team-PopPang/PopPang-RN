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

RCT_EXPORT_METHOD(getAccessToken:(nullable NSString *)rejectedAccessToken
                  expired:(BOOL)expired
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

  NSString *rejected = rejectedAccessToken.length > 0 ? rejectedAccessToken : nil;
  provider(rejected, expired, ^(NSString *_Nullable accessToken, BOOL temporaryFailure) {
    if (accessToken.length > 0) {
      resolve(accessToken);
    } else if (temporaryFailure) {
      reject(@"temporary_failure", @"로그인 정보를 잠시 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.", nil);
    } else {
      reject(@"login_required", @"로그인 정보가 만료되었습니다. 다시 로그인해 주세요.", nil);
    }
  });
}

@end
