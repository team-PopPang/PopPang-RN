import {NativeModules} from 'react-native';

type PopPangHostAuthModule = {
  getAccessToken?: (forceRefresh: boolean) => Promise<string>;
};

function hostAuthModule(): PopPangHostAuthModule | undefined {
  return NativeModules.PopPangHostAuth as PopPangHostAuthModule | undefined;
}

/** 호스트 앱에서 V2 API용 Access Token을 받는다. 토큰 저장과 갱신은 호스트 앱이 맡는다. */
export async function getPopPangAccessToken(forceRefresh = false): Promise<string> {
  const getAccessToken = hostAuthModule()?.getAccessToken;
  if (!getAccessToken) {
    throw new Error('로그인 정보를 확인할 수 없습니다. 앱을 최신 버전으로 업데이트해 주세요.');
  }
  return getAccessToken(forceRefresh);
}
