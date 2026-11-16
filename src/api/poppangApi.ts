import {getPopPangAccessToken} from '../native/PopPangHostAuth';

/** PopPang V2 API 주소. 모든 요청은 Access Token의 사용자로 처리되므로 userUuid를 보내지 않는다. */
export const POPPANG_API_BASE_URL = 'https://poppang.co.kr/api/v2';

export type AuthorizedResponse = {status: number; text: () => string | Promise<string>};

/**
 * Access Token을 붙여 요청한다. 서버가 401을 주면 호스트 앱에 토큰 갱신을 요청하고 한 번만 다시 보낸다.
 * 요청 방식(fetch, multipart 업로드)이 달라도 같은 규칙을 쓰도록 실제 전송은 send에 맡긴다.
 */
export async function requestWithAccessToken(
  send: (authorization: string) => Promise<AuthorizedResponse>,
): Promise<AuthorizedResponse> {
  const response = await send(`Bearer ${await getPopPangAccessToken(false)}`);
  if (response.status !== 401) return response;

  return send(`Bearer ${await getPopPangAccessToken(true)}`);
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
