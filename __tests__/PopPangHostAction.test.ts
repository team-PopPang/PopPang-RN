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

  test('호스트가 허용한 팝업 관리 뒤로가기 이벤트를 네이티브로 전달한다', () => {
    emitPopPangNativeEvent(
      POPPANG_NATIVE_EVENT.POPUP_REQUEST_MANAGEMENT_BACK,
      [POPPANG_NATIVE_EVENT.POPUP_REQUEST_MANAGEMENT_BACK],
    );

    expect(emit).toHaveBeenCalledWith('popupRequestManagementBack');
  });

  test('호스트가 허용한 팝업 제보 뒤로가기 이벤트를 네이티브로 전달한다', () => {
    emitPopPangNativeEvent(POPPANG_NATIVE_EVENT.POPUP_REQUEST_BACK, [
      POPPANG_NATIVE_EVENT.POPUP_REQUEST_BACK,
    ]);

    expect(emit).toHaveBeenCalledWith('popupRequestBack');
  });

  test('호스트가 허용하지 않은 이벤트는 전달하지 않는다', () => {
    emitPopPangNativeEvent(
      POPPANG_NATIVE_EVENT.POPUP_REQUEST_SUBMITTED,
      [],
    );

    expect(emit).not.toHaveBeenCalled();
  });
});
