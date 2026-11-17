import {installFakeHost} from '../jest/fakeHost';
import {
  emitPopPangNativeEvent,
  POPPANG_NATIVE_EVENT,
} from '../src/native/PopPangHostAction';

describe('PopPangHostAction', () => {
  let fake: ReturnType<typeof installFakeHost>;

  beforeEach(() => {
    fake = installFakeHost(jest.fn());
  });

  afterEach(() => fake.unregister());

  test('제출 완료는 계약의 popupRequestSubmitted 이벤트로 보낸다', () => {
    emitPopPangNativeEvent(POPPANG_NATIVE_EVENT.POPUP_REQUEST_SUBMITTED, [
      POPPANG_NATIVE_EVENT.POPUP_REQUEST_SUBMITTED,
    ]);

    expect(fake.host.emit).toHaveBeenCalledWith(
      expect.objectContaining({kind: 'event', name: 'popupRequestSubmitted'}),
    );
    expect(fake.host.close).not.toHaveBeenCalled();
  });

  test.each([
    POPPANG_NATIVE_EVENT.POPUP_REQUEST_BACK,
    POPPANG_NATIVE_EVENT.POPUP_REQUEST_MANAGEMENT_BACK,
  ])('%s는 표준 닫기로 보낸다', eventName => {
    emitPopPangNativeEvent(eventName, [eventName]);

    expect(fake.host.close).toHaveBeenCalledTimes(1);
    expect(fake.host.emit).not.toHaveBeenCalled();
  });

  test('허용하지 않은 이벤트는 보내지 않는다', () => {
    emitPopPangNativeEvent(POPPANG_NATIVE_EVENT.POPUP_REQUEST_SUBMITTED, []);

    expect(fake.host.emit).not.toHaveBeenCalled();
    expect(fake.host.close).not.toHaveBeenCalled();
  });

  test('Nativepiece로 열리지 않은 화면(RN 단독 데모)에서는 아무것도 하지 않는다', () => {
    fake.unregister();

    expect(() =>
      emitPopPangNativeEvent(POPPANG_NATIVE_EVENT.POPUP_REQUEST_BACK, [
        POPPANG_NATIVE_EVENT.POPUP_REQUEST_BACK,
      ]),
    ).not.toThrow();
  });
});
