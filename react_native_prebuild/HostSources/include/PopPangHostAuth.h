#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

/// 호스트 앱이 Access Token을 돌려줄 때 부르는 completion. 실패하면 accessToken을 nil로 넘긴다.
typedef void (^PopPangAccessTokenCompletion)(NSString *_Nullable accessToken);

/// RN이 V2 API를 부르기 전에 Access Token을 요청한다.
/// forceRefresh가 YES면 서버가 401을 돌려준 뒤라서, 호스트 앱이 토큰을 새로 갱신해 돌려줘야 한다.
typedef void (^PopPangAccessTokenProvider)(BOOL forceRefresh, PopPangAccessTokenCompletion completion);

// V2 API 인증 토큰을 호스트 앱(iOS)에서 받아 React Native에 넘긴다.
// 토큰 저장과 갱신은 호스트 앱이 맡고, RN은 요청할 때마다 이 모듈로 받는다.
@interface PopPangHostAuth : NSObject <RCTBridgeModule>

+ (void)setAccessTokenProvider:(nullable PopPangAccessTokenProvider)provider;

@end

NS_ASSUME_NONNULL_END
