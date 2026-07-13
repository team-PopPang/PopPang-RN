import {NativeModules} from 'react-native';

export const POPPANG_NATIVE_EVENT = {
  POPUP_REQUEST_SUBMITTED: 'popupRequestSubmitted',
} as const;

export type PopPangNativeEvent =
  (typeof POPPANG_NATIVE_EVENT)[keyof typeof POPPANG_NATIVE_EVENT];

type PopPangHostActionModule = {
  emit?: (eventName: PopPangNativeEvent) => void;
};

function hostActionModule(): PopPangHostActionModule | undefined {
  return NativeModules.PopPangHostAction as PopPangHostActionModule | undefined;
}

export function emitPopPangNativeEvent(
  eventName: PopPangNativeEvent,
  enabledEvents?: readonly PopPangNativeEvent[] | null,
) {
  if (!enabledEvents?.includes(eventName)) return;

  hostActionModule()?.emit?.(eventName);
}
