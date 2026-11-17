import {NativeModules} from 'react-native';

type PopPangHostAuthModule = {
  getAccessToken?: (rejectedAccessToken: string | null, expired: boolean) => Promise<string>;
};

/** 401을 받은 요청의 정보. 호스트 앱은 이 토큰을 기준으로 갱신하거나 로그아웃한다. */
export type RejectedAccessToken = {
  /** 401을 받은 요청에 담았던 Access Token */
  accessToken: string;
  /** 서버 코드가 5002(Access Token 만료)인지 */
  expired: boolean;
};

function hostAuthModule(): PopPangHostAuthModule | undefined {
  return NativeModules.PopPangHostAuth as PopPangHostAuthModule | undefined;
}

/**
 * 호스트 앱에서 V2 API용 Access Token을 받는다. 토큰 저장과 갱신은 호스트 앱이 맡는다.
 * 401을 받은 뒤라면 rejected로 그 요청의 토큰과 만료 여부를 넘긴다.
 */
export async function getPopPangAccessToken(rejected?: RejectedAccessToken): Promise<string> {
  const getAccessToken = hostAuthModule()?.getAccessToken;
  if (!getAccessToken) {
    throw new Error('로그인 정보를 확인할 수 없습니다. 앱을 최신 버전으로 업데이트해 주세요.');
  }
  return getAccessToken(rejected?.accessToken ?? null, rejected?.expired ?? false);
}
