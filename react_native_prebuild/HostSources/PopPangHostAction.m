#import "PopPangHostAction.h"
#import <React/RCTBridgeModule.h>

NSString *const PopPangNativeEventPopupRequestSubmitted = @"popupRequestSubmitted";

static PopPangHostActionHandler popPangEventHandler;

@implementation PopPangHostAction

RCT_EXPORT_MODULE(PopPangHostAction)

+ (void)setEventHandler:(PopPangHostActionHandler)eventHandler
{
  @synchronized(self) {
    popPangEventHandler = [eventHandler copy];
  }
}

RCT_EXPORT_METHOD(emit:(NSString *)eventName)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    PopPangHostActionHandler eventHandler;

    @synchronized(PopPangHostAction.class) {
      eventHandler = popPangEventHandler;
    }

    if (eventHandler != nil) {
      eventHandler(eventName);
    }
  });
}

@end
