import React from 'react';
import {useHost} from '@team-poppang/nativepiece-runtime';
import {PopPangRequestFeature} from '../Features/PopupRequest';
import {PopPangRequestManagementFeature} from '../Features/PopupRequestManagement';
import {POPPANG_NATIVE_EVENT} from '../native/PopPangHostAction';
import {registerHost} from './hostRegistry';

type ScreenRootProps = {userUuid: string};

// Nativepiece로 열린 화면은 뒤로가기·제출 완료를 항상 호스트에 보낸다.
const ALL_NATIVE_EVENTS = Object.values(POPPANG_NATIVE_EVENT);

function useRegisteredHost() {
  const host = useHost();
  // 첫 렌더에서 Repository가 바로 토큰을 받을 수 있게 effect보다 먼저 등록한다.
  const unregister = React.useRef<(() => void) | null>(null);
  if (!unregister.current) unregister.current = registerHost(host);
  React.useEffect(() => () => unregister.current?.(), []);
}

export function PopupRequestScreenRoot({userUuid}: ScreenRootProps) {
  useRegisteredHost();
  return <PopPangRequestFeature nativeEvents={ALL_NATIVE_EVENTS} userUuid={userUuid} />;
}

export function PopupRequestManagementScreenRoot({userUuid}: ScreenRootProps) {
  useRegisteredHost();
  return <PopPangRequestManagementFeature nativeEvents={ALL_NATIVE_EVENTS} userUuid={userUuid} />;
}
