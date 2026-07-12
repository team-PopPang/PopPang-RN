import {
  createUploadImageMetadata,
  normalizeImageMimeType,
} from '../src/Features/PopupRequest/application/popupRequestImage';

test.each([
  ['photo.JPG', 'image/jpeg'],
  ['photo.jpeg', 'image/jpeg'],
  ['photo.png', 'image/png'],
  ['photo.HEIC', 'image/heic'],
  ['photo.heif', 'image/heif'],
])('%s와 %s 조합을 허용한다', (fileName, mimeType) => {
  expect(createUploadImageMetadata(fileName, mimeType, 0)).toEqual({
    fileName,
    mimeType,
  });
});

test('image/jpg를 표준 image/jpeg로 정규화한다', () => {
  expect(normalizeImageMimeType('image/jpg')).toBe('image/jpeg');
  expect(createUploadImageMetadata('photo.jpg', 'image/jpg', 0)).toEqual({
    fileName: 'photo.jpg',
    mimeType: 'image/jpeg',
  });
});

test.each([
  ['photo.heic', 'image/jpeg'],
  ['photo.jpg', 'image/heic'],
  ['photo.gif', 'image/gif'],
  ['photo', 'image/jpeg'],
])('%s와 %s의 잘못된 조합을 거부한다', (fileName, mimeType) => {
  expect(createUploadImageMetadata(fileName, mimeType, 0)).toBeNull();
});

test('파일명이 없으면 MIME 타입과 일치하는 이름을 만든다', () => {
  expect(createUploadImageMetadata(undefined, 'image/png', 2)).toEqual({
    fileName: expect.stringMatching(/^popup-request-\d+-2\.png$/),
    mimeType: 'image/png',
  });
});
