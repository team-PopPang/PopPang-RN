import {NativeModules} from 'react-native';
import {getPopPangAccessToken} from '../src/native/PopPangHostAuth';

describe('PopPangHostAuth', () => {
  afterEach(() => {
    delete NativeModules.PopPangHostAuth;
  });

  test('호스트 앱의 네이티브 모듈에서 Access Token을 받는다', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('access');
    NativeModules.PopPangHostAuth = {getAccessToken};

    await expect(getPopPangAccessToken()).resolves.toBe('access');
    expect(getAccessToken).toHaveBeenCalledWith(null, false);
  });

  test('401을 받은 뒤에는 그 요청의 토큰과 만료 여부를 넘긴다', async () => {
    const getAccessToken = jest.fn().mockResolvedValue('refreshed');
    NativeModules.PopPangHostAuth = {getAccessToken};

    await expect(
      getPopPangAccessToken({accessToken: 'access', expired: true}),
    ).resolves.toBe('refreshed');
    expect(getAccessToken).toHaveBeenCalledWith('access', true);
  });

  test('네이티브 모듈이 없는 이전 호스트 앱이면 업데이트 안내 오류를 던진다', async () => {
    await expect(getPopPangAccessToken()).rejects.toThrow(
      '로그인 정보를 확인할 수 없습니다. 앱을 최신 버전으로 업데이트해 주세요.',
    );
  });
});
