import type {Host} from '@team-poppang/nativepiece-runtime';
import {registerHost} from '../src/nativepiece/hostRegistry';

type GetAccessToken = (rejectedAccessToken: string | null, expired: boolean) => Promise<string>;

/**
 * 테스트용 Nativepiece 호스트를 등록한다. getAccessToken 호출은 계약 요청을 풀어 (rejectedAccessToken, expired)로 넘긴다.
 * 반환한 unregister를 afterEach에서 불러 다음 테스트에 남지 않게 한다.
 */
export function installFakeHost(getAccessToken: GetAccessToken) {
  const host = {
    surfaceId: 'test-surface',
    emit: jest.fn(),
    close: jest.fn(),
    markReady: jest.fn(),
    call: jest.fn(async (_call: unknown, request: {rejectedAccessToken: string | null; expired: boolean}) => ({
      accessToken: await getAccessToken(request.rejectedAccessToken, request.expired),
    })),
  };
  const unregister = registerHost(host as unknown as Host);
  return {host, unregister};
}
