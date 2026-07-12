import {
  createInitialPopupRequestForm,
  mapPopupRequest,
  validatePopupRequest,
} from '../src/Features/PopupRequest/application/popupRequestForm';

function validForm() {
  return {
    ...createInitialPopupRequestForm(),
    name: '성수 팝업',
    roadAddress: '서울 성동구 성수이로 00',
    region: '서울',
    description: '브랜드 팝업',
    selectedRecommendIds: [3, 1],
    images: [
      {
        fileName: 'a.jpg',
        id: 'first',
        mimeType: 'image/jpeg',
        uri: 'file:///tmp/a.jpg',
      },
    ],
  };
}

test('필수 입력을 검증한다', () => {
  expect(validatePopupRequest(createInitialPopupRequestForm(), 'user-1')).toBe(
    '팝업명을 입력해 주세요.',
  );
});

test('유효한 폼을 Swift API 계약과 같은 제출 모델로 변환한다', () => {
  const request = mapPopupRequest(validForm(), 'user-1');

  expect(request.userUuid).toBe('user-1');
  expect(request.name).toBe('성수 팝업');
  expect(request.recommendIdList).toEqual([1, 3]);
  expect(request).not.toHaveProperty('imageList');
  expect(request.address).toBe('서울 성동구 성수이로 00');
});

test('HH:mm 형식이 아닌 운영 시간을 거부한다', () => {
  const form = {...validForm(), openTime: '25:10'};
  expect(validatePopupRequest(form, 'user-1')).toBe(
    '오픈 시간을 HH:mm 형식으로 입력해 주세요.',
  );
});

test('운영 시간을 Swagger LocalTime 객체로 변환한다', () => {
  const request = mapPopupRequest(
    {...validForm(), closeTime: '20:30', openTime: '10:05'},
    'user-1',
  );

  expect(request.openTime).toEqual({hour: 10, minute: 5, nano: 0, second: 0});
  expect(request.closeTime).toEqual({hour: 20, minute: 30, nano: 0, second: 0});
});

test('파일 확장자와 MIME 타입이 다른 이미지를 거부한다', () => {
  const form = {
    ...validForm(),
    images: [
      {
        fileName: 'IMG_1234.HEIC',
        id: 'mismatch',
        mimeType: 'image/jpeg',
        uri: 'file:///tmp/IMG_1234.HEIC',
      },
    ],
  };

  expect(validatePopupRequest(form, 'user-1')).toBe(
    '지원하지 않거나 파일 정보가 올바르지 않은 이미지가 있습니다.',
  );
});
