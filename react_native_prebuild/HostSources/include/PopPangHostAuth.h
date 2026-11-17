#import <Foundation/Foundation.h>
#import <React/RCTBridgeModule.h>

NS_ASSUME_NONNULL_BEGIN

/// 호스트 앱이 Access Token 요청에 답할 때 부르는 completion.
/// 토큰을 주지 못하면 accessToken을 nil로 넘기고, 다시 로그인해야 하는지(NO) 잠시 뒤 다시 시도하면 되는지(YES)를 temporaryFailure로 알린다.
typedef void (^PopPangAccessTokenCompletion)(NSString *_Nullable accessToken, BOOL temporaryFailure);

/// RN이 V2 API를 부르기 전과 401을 받은 뒤에 Access Token을 요청한다.
/// - rejectedAccessToken: nil이면 지금 쓸 토큰을 요청한다. 값이 있으면 그 토큰으로 보낸 요청이 401을 받았다.
/// - expired: 401의 서버 코드가 5002(Access Token 만료)면 YES. 호스트 앱은 그 토큰을 만료된 토큰으로 보고 갱신한다.
///   NO면 호스트 앱의 다른 요청과 같은 규칙으로 처리한다(그 토큰이 아직 저장돼 있으면 로그아웃).
typedef void (^PopPangAccessTokenProvider)(NSString *_Nullable rejectedAccessToken, BOOL expired, PopPangAccessTokenCompletion completion);

// V2 API 인증 토큰을 호스트 앱(iOS)에서 받아 React Native에 넘긴다.
// 토큰 저장과 갱신은 호스트 앱이 맡고, RN은 요청할 때마다 이 모듈로 받는다.
@interface PopPangHostAuth : NSObject <RCTBridgeModule>

+ (void)setAccessTokenProvider:(nullable PopPangAccessTokenProvider)provider;

@end

NS_ASSUME_NONNULL_END
