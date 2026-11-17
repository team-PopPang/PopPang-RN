import {NativepieceCallError} from '@team-poppang/nativepiece-runtime';
import {installFakeHost} from '../jest/fakeHost';
import {getPopPangAccessToken} from '../src/native/PopPangHostAuth';

describe('PopPangHostAuth', () => {
  let unregisterHost: (() => void) | undefined;

  afterEach(() => {
    unregisterHost?.();
    unregisterHost = undefined;
  });

  test('요청 전에는 보낸 토큰 없이 호스트 앱에 Access Token을 묻는다', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('access');
    const {host, unregister} = installFakeHost(getAccessToken);
    unregisterHost = unregister;

    await expect(getPopPangAccessToken()).resolves.toBe('access');
    expect(getAccessToken).toHaveBeenCalledWith(null, false);
    expect(host.call).toHaveBeenCalledWith(
      expect.objectContaining({kind: 'call', name: 'getAccessToken'}),
      {expired: false, rejectedAccessToken: null},
    );
  });

  test('401을 받은 뒤에는 그 요청의 토큰과 만료 여부를 넘긴다', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('refreshed');
    unregisterHost = installFakeHost(getAccessToken).unregister;

    await expect(
      getPopPangAccessToken({accessToken: 'access', expired: true}),
    ).resolves.toBe('refreshed');
    expect(getAccessToken).toHaveBeenCalledWith('access', true);
  });

  test.each([
    ['login_required', '로그인 정보가 만료되었습니다. 다시 로그인해 주세요.'],
    ['temporary_failure', '로그인 정보를 잠시 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'],
    ['unhandled', '로그인 정보를 확인할 수 없습니다. 앱을 최신 버전으로 업데이트해 주세요.'],
    ['timeout', '로그인 정보를 잠시 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'],
  ])('호스트 앱이 %s로 거절하면 안내 문구로 바꾼다', async (code, message) => {
    const getAccessToken = jest.fn().mockRejectedValue(new NativepieceCallError(code, 'native'));
    unregisterHost = installFakeHost(getAccessToken).unregister;

    await expect(getPopPangAccessToken()).rejects.toThrow(message);
  });

  test('Nativepiece로 열리지 않은 화면이면 업데이트 안내 오류를 던진다', async () => {
    await expect(getPopPangAccessToken()).rejects.toThrow(
      '로그인 정보를 확인할 수 없습니다. 앱을 최신 버전으로 업데이트해 주세요.',
    );
  });
});
