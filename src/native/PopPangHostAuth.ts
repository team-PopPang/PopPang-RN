import {NativepieceCallError} from '@team-poppang/nativepiece-runtime';
import contract from '../../nativepiece.contract';
import {currentHost} from '../nativepiece/hostRegistry';

/** 401을 받은 요청의 정보. 호스트 앱은 이 토큰을 기준으로 갱신하거나 로그아웃한다. */
export type RejectedAccessToken = {
  /** 401을 받은 요청에 담았던 Access Token */
  accessToken: string;
  /** 서버 코드가 5002(Access Token 만료)인지 */
  expired: boolean;
};

/** 호스트 앱이 토큰을 줄 수 없을 때 보내는 오류 code */
export const HOST_AUTH_ERROR = {
  LOGIN_REQUIRED: 'login_required',
  TEMPORARY_FAILURE: 'temporary_failure',
} as const;

const NO_HOST_MESSAGE = '로그인 정보를 확인할 수 없습니다. 앱을 최신 버전으로 업데이트해 주세요.';
const LOGIN_REQUIRED_MESSAGE = '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.';
const TEMPORARY_FAILURE_MESSAGE = '로그인 정보를 잠시 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.';

function hostAuthErrorMessage(error: unknown): string {
  if (error instanceof NativepieceCallError) {
    if (error.code === HOST_AUTH_ERROR.LOGIN_REQUIRED) return LOGIN_REQUIRED_MESSAGE;
    if (error.code === HOST_AUTH_ERROR.TEMPORARY_FAILURE) return TEMPORARY_FAILURE_MESSAGE;
    // 'unhandled': 호스트 앱이 getAccessToken을 구현하지 않은 이전 버전이다.
    if (error.code === 'unhandled') return NO_HOST_MESSAGE;
  }
  return TEMPORARY_FAILURE_MESSAGE;
}

/**
 * 호스트 앱에서 V2 API용 Access Token을 받는다. 토큰 저장과 갱신은 호스트 앱이 맡는다.
 * 401을 받은 뒤라면 rejected로 그 요청의 토큰과 만료 여부를 넘긴다.
 */
export async function getPopPangAccessToken(rejected?: RejectedAccessToken): Promise<string> {
  const host = currentHost();
  if (!host) throw new Error(NO_HOST_MESSAGE);

  try {
    const response = await host.call(contract.calls.getAccessToken, {
      expired: rejected?.expired ?? false,
      rejectedAccessToken: rejected?.accessToken ?? null,
    });
    return response.accessToken;
  } catch (error) {
    throw new Error(hostAuthErrorMessage(error));
  }
}
