import { defineConfig } from '@team-poppang/nativepiece-cli';

export default defineConfig({
  // Swift 모듈 이름과 Kotlin 객체 이름이에요. 앱에서 `import PopPangRN`으로 써요.
  name: 'PopPangRN',
  // 배포 버전은 package.json의 version을 따라요.
  entry: 'nativepiece.entry.ts',
  contract: 'nativepiece.contract.ts',
  ios: {
    // PopPang-iOS의 deployment target과 같아요.
    deploymentTarget: '17.0',
  },
  android: {
    group: 'com.poppang',
    // 기본값은 이름을 나눈 pop-pang-rn-android라서 이전 Android SDK와 같은 이름으로 정해요.
    artifactId: 'poppang-rn-android',
    namespace: 'com.poppang.rn',
  },
  // publish ios: 이 레포(team-PopPang/PopPang-RN)에 Package.swift·태그·Release를 만들어요.
  // publish android: GitHub Packages Maven에 올려요.
  publish: {
    android: { url: 'https://maven.pkg.github.com/team-PopPang/PopPang-RN' },
  },
});
