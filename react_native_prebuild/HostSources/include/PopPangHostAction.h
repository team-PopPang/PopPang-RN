#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

FOUNDATION_EXPORT NSString *const PopPangNativeEventPopupRequestSubmitted;
FOUNDATION_EXPORT NSString *const PopPangNativeEventPopupRequestBack;
FOUNDATION_EXPORT NSString *const PopPangNativeEventPopupRequestManagementBack;

typedef void (^PopPangHostActionHandler)(NSString *eventName);

// React Native 이벤트를 SwiftUI 호스트 화면의 액션으로 전달한다.
@interface PopPangHostAction : NSObject

+ (void)setEventHandler:(nullable PopPangHostActionHandler)eventHandler;

@end

NS_ASSUME_NONNULL_END
