import type {Host} from '@team-poppang/nativepiece-runtime';

// API 요청(Repository)은 React 밖에서 토큰을 받아야 해서, 화면이 열리는 동안 호스트를 여기에 둔다.
// 화면이 여러 개 열려 있으면 마지막에 열린 화면의 호스트를 쓴다. 어느 화면으로 보내도 호스트 앱의 같은 토큰 저장소가 답한다.
const mountedHosts: Host[] = [];

export function registerHost(host: Host): () => void {
  mountedHosts.push(host);
  return () => {
    const index = mountedHosts.lastIndexOf(host);
    if (index >= 0) mountedHosts.splice(index, 1);
  };
}

/** 지금 열린 Nativepiece 화면의 호스트. RN 단독 데모처럼 Nativepiece로 열리지 않았으면 undefined다. */
export function currentHost(): Host | undefined {
  return mountedHosts[mountedHosts.length - 1];
}
