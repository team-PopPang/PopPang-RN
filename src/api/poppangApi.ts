import {getPopPangAccessToken} from '../native/PopPangHostAuth';

/** PopPang V2 API 주소. 모든 요청은 Access Token의 사용자로 처리되므로 userUuid를 보내지 않는다. */
export const POPPANG_API_BASE_URL = 'https://poppang.co.kr/api/v2';

export type AuthorizedResponse = {status: number; text: () => string | Promise<string>};

/** 서버가 Access Token 만료에 쓰는 오류 코드 */
const EXPIRED_ACCESS_TOKEN_CODE = 5002;

async function serverErrorCode(response: AuthorizedResponse): Promise<number | null> {
  try {
    const body = JSON.parse(await response.text()) as {code?: unknown};
    return typeof body.code === 'number' ? body.code : null;
  } catch {
    return null;
  }
}

/**
 * Access Token을 붙여 요청한다. 서버가 401을 주면 그 요청에 담은 토큰과 만료(5002) 여부를 호스트 앱에 넘겨
 * 새 토큰을 받고 한 번만 다시 보낸다. 호스트 앱은 만료면 갱신하고, 아니면 앱의 다른 요청과 같은 규칙으로 처리한다.
 * 요청 방식(fetch, multipart 업로드)이 달라도 같은 규칙을 쓰도록 실제 전송은 send에 맡긴다.
 */
export async function requestWithAccessToken(
  send: (authorization: string) => Promise<AuthorizedResponse>,
): Promise<AuthorizedResponse> {
  const accessToken = await getPopPangAccessToken();
  const response = await send(`Bearer ${accessToken}`);
  if (response.status !== 401) return response;

  const expired = (await serverErrorCode(response)) === EXPIRED_ACCESS_TOKEN_CODE;
  const retryAccessToken = await getPopPangAccessToken({accessToken, expired});
  return send(`Bearer ${retryAccessToken}`);
}

/** Access Token을 붙여 fetch로 보낸다. */
export async function authorizedFetch(
  url: string,
  init: RequestInit = {},
): Promise<AuthorizedResponse> {
  return requestWithAccessToken(async authorization => {
    const response = await fetch(url, {
      ...init,
      headers: {...(init.headers as Record<string, string>), Authorization: authorization},
    });
    return {status: response.status, text: () => response.text()};
  });
}

export function apiErrorMessage(status: number, body: string) {
  if (status === 401) return '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.';
  if (status === 403) return '이 기능을 사용할 권한이 없습니다.';
  try {
    const response = JSON.parse(body) as {message?: string};
    return response.message || `요청에 실패했습니다. (${status})`;
  } catch {
    return `요청에 실패했습니다. (${status})`;
  }
}
