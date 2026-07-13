import {NativeModules} from 'react-native';
import {
  emitPopPangNativeEvent,
  POPPANG_NATIVE_EVENT,
} from '../src/native/PopPangHostAction';

describe('PopPangHostAction', () => {
  const emit = jest.fn();

  beforeEach(() => {
    emit.mockClear();
    NativeModules.PopPangHostAction = {emit};
  });

  test('호스트가 허용한 완료 이벤트만 네이티브로 전달한다', () => {
    emitPopPangNativeEvent(POPPANG_NATIVE_EVENT.POPUP_REQUEST_SUBMITTED, [
      POPPANG_NATIVE_EVENT.POPUP_REQUEST_SUBMITTED,
    ]);

    expect(emit).toHaveBeenCalledWith('popupRequestSubmitted');
  });

  test('호스트가 허용하지 않은 이벤트는 전달하지 않는다', () => {
    emitPopPangNativeEvent(
      POPPANG_NATIVE_EVENT.POPUP_REQUEST_SUBMITTED,
      [],
    );

    expect(emit).not.toHaveBeenCalled();
  });
});
