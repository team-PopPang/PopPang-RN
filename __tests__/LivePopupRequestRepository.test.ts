import ReactNativeBlobUtil from 'react-native-blob-util';
import {mapPopupRequest} from '../src/Features/PopupRequest/application/popupRequestForm';
import {LivePopupRequestRepository} from '../src/Features/PopupRequest/data/repositories/LivePopupRequestRepository';
import type {PopupRequestImage} from '../src/Features/PopupRequest/domain/entities/PopupRequestForm';

const fetchMock = ReactNativeBlobUtil.fetch as jest.Mock;
const wrapMock = ReactNativeBlobUtil.wrap as jest.Mock;
const writeFileMock = ReactNativeBlobUtil.fs.writeFile as jest.Mock;
const unlinkMock = ReactNativeBlobUtil.fs.unlink as jest.Mock;

const images: PopupRequestImage[] = [
  {
    fileName: 'popup-one.jpg',
    id: 'image-1',
    mimeType: 'image/jpeg',
    uri: 'file:///tmp/popup%20one.jpg',
  },
  {
    fileName: 'popup-two.heic',
    id: 'image-2',
    mimeType: 'image/heic',
    uri: 'file:///tmp/popup-two.heic',
  },
];

const request = mapPopupRequest(
  {
    address: '',
    closeTime: '20:00',
    description: '테스트 제보 내용',
    endDate: '2026-07-19',
    images,
    instagramUrl: '',
    latitude: '',
    longitude: '',
    name: '성수 팝업',
    openTime: '10:00',
    region: '서울',
    roadAddress: '서울 성동구 테스트로 1',
    selectedRecommendIds: [1, 2, 3],
    startDate: '2026-07-12',
  },
  '43bbbfea-b5c9-40f0-9822-0c8e5cbd0379',
);

function response(status: number, body = '') {
  return {
    info: () => ({status}),
    text: jest.fn().mockResolvedValue(body),
  };
}

describe('LivePopupRequestRepository multipart 업로드', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    writeFileMock.mockResolvedValue(undefined);
    unlinkMock.mockResolvedValue(undefined);
    wrapMock.mockImplementation((path: string) => `wrapped:${path}`);
  });

  test('request JSON과 모든 이미지를 백엔드 규격의 multipart 파트로 전송한다', async () => {
    fetchMock.mockResolvedValue(response(200));

    await new LivePopupRequestRepository().submit(request, images);

    const requestFilePath = expect.stringMatching(
      /^\/tmp\/popup-request-\d+\.json$/,
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      requestFilePath,
      JSON.stringify(request),
      'utf8',
    );
    expect(wrapMock).toHaveBeenCalledWith('/tmp/popup one.jpg');
    expect(wrapMock).toHaveBeenCalledWith('/tmp/popup-two.heic');
    expect(fetchMock).toHaveBeenCalledWith(
      'POST',
      'https://poppang.co.kr/api/v1/popup-submissions',
      {Accept: 'application/json', 'Content-Type': 'multipart/form-data'},
      [
        expect.objectContaining({
          filename: 'request.json',
          name: 'request',
          type: 'application/json',
        }),
        {
          data: 'wrapped:/tmp/popup one.jpg',
          filename: 'popup-one.jpg',
          name: 'images',
          type: 'image/jpeg',
        },
        {
          data: 'wrapped:/tmp/popup-two.heic',
          filename: 'popup-two.heic',
          name: 'images',
          type: 'image/heic',
        },
      ],
    );
    expect(unlinkMock).toHaveBeenCalledWith(requestFilePath);
  });

  test('백엔드 4307 응답 메시지를 그대로 오류로 전달한다', async () => {
    fetchMock.mockResolvedValue(
      response(
        400,
        JSON.stringify({
          code: 4307,
          message: '팝업 제보 요청값이 올바르지 않습니다.',
        }),
      ),
    );

    await expect(
      new LivePopupRequestRepository().submit(request, images),
    ).rejects.toThrow('팝업 제보 요청값이 올바르지 않습니다.');
  });

  test('업로드가 실패해도 임시 request JSON 파일을 삭제한다', async () => {
    fetchMock.mockRejectedValue(new Error('network error'));

    await expect(
      new LivePopupRequestRepository().submit(request, images),
    ).rejects.toThrow('network error');

    expect(unlinkMock).toHaveBeenCalledWith(
      expect.stringMatching(/^\/tmp\/popup-request-\d+\.json$/),
    );
  });
});
