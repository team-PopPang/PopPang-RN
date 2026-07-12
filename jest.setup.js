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
