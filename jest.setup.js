jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {
    fetch: jest.fn(),
    fs: {
      dirs: {CacheDir: '/tmp'},
      unlink: jest.fn().mockResolvedValue(undefined),
      writeFile: jest.fn().mockResolvedValue(undefined),
    },
    wrap: jest.fn(uri => uri),
  },
}));

jest.mock('react-native-image-picker', () => ({
  launchImageLibrary: jest.fn(),
}));

// Nativepiece 런타임은 불러올 때 네이티브 TurboModule(NativepieceHost)을 찾는다. jest에는 없으므로 빈 모듈로 바꾼다.
// 테스트는 jest/fakeHost.ts의 가짜 호스트로 호스트 앱과 주고받는 것을 확인한다.
jest.mock('@team-poppang/nativepiece-runtime/src/specs/NativeNativepieceHost', () => ({
  __esModule: true,
  default: {
    onEnvelope: jest.fn(() => ({remove: jest.fn()})),
    post: jest.fn(),
    protocolVersion: jest.fn(() => 1),
  },
}));
