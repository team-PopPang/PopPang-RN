import contract from '../../nativepiece.contract';
import {currentHost} from '../nativepiece/hostRegistry';

export const POPPANG_NATIVE_EVENT = {
  POPUP_REQUEST_BACK: 'popupRequestBack',
  POPUP_REQUEST_MANAGEMENT_BACK: 'popupRequestManagementBack',
  POPUP_REQUEST_SUBMITTED: 'popupRequestSubmitted',
} as const;

export type PopPangNativeEvent =
  (typeof POPPANG_NATIVE_EVENT)[keyof typeof POPPANG_NATIVE_EVENT];

/**
 * 호스트 앱에 화면 이벤트를 보낸다. 뒤로가기는 Nativepiece 표준 닫기(`host.close`)로, 제출 완료는 계약의 이벤트로 보낸다.
 * enabledEvents에 없는 이벤트나, Nativepiece로 열리지 않은 화면(RN 단독 데모)에서는 아무것도 하지 않는다.
 */
export function emitPopPangNativeEvent(
  eventName: PopPangNativeEvent,
  enabledEvents?: readonly PopPangNativeEvent[] | null,
) {
  if (!enabledEvents?.includes(eventName)) return;
  const host = currentHost();
  if (!host) return;

  if (eventName === POPPANG_NATIVE_EVENT.POPUP_REQUEST_SUBMITTED) {
    host.emit(contract.events.popupRequestSubmitted);
  } else {
    host.close();
  }
}
