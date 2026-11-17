import { call, defineContract, event, screen } from '@team-poppang/nativepiece-runtime';

/** 화면을 열 때 호스트 앱이 넘기는 값 */
type PopPangScreenProps = {
  /** 로그인한 사용자. 화면 입력 검증에만 쓰고 서버에는 보내지 않아요(V2는 Access Token으로 사용자를 정해요). */
  userUuid: string;
};

// PopPang RN 모듈과 호스트 앱(iOS·Android)이 주고받는 것이에요.
// `npx nativepiece codegen`이 이 파일로 Swift·Kotlin 타입을 만들어요.
export default defineContract({
  screens: {
    /** 팝업 제보 */
    popupRequest: screen<PopPangScreenProps>(),
    /** 관리자 팝업 제보 관리 */
    popupRequestManagement: screen<PopPangScreenProps>(),
  },
  events: {
    /** RN → 호스트: 제보를 등록하고 완료 알림의 확인을 눌렀어요. 뒤로가기는 표준 닫기(`host.close`)로 보내요. */
    popupRequestSubmitted: event(),
  },
  calls: {
    /**
     * RN → 호스트 → RN: V2 API용 Access Token을 받아요.
     * - 요청 전: rejectedAccessToken null, expired false → 저장된 토큰
     * - 401 + 5002: 보낸 토큰, expired true → 그 토큰 기준으로 갱신한 토큰
     * - 다른 401: 보낸 토큰, expired false → 아직 그 토큰이면 로그아웃, 바뀌었으면 새 토큰
     * 줄 수 없으면 호스트는 오류 code `login_required` 또는 `temporary_failure`로 거절해요.
     */
    getAccessToken: call<
      { rejectedAccessToken: string | null; expired: boolean },
      { accessToken: string }
    >(),
  },
  messages: {},
});
