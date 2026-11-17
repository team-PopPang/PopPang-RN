import {NativeModules} from 'react-native';
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
    NativeModules.PopPangHostAuth = {
      getAccessToken: jest.fn((rejectedAccessToken: string | null) =>
        Promise.resolve(rejectedAccessToken ? 'refreshed' : 'access'),
      ),
    };
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
      'https://poppang.co.kr/api/v2/popup-submissions',
      {
        Accept: 'application/json',
        Authorization: 'Bearer access',
        'Content-Type': 'multipart/form-data',
      },
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

  test('401 5002면 보낸 토큰을 만료로 넘겨 새 토큰을 받고 한 번만 다시 보낸다', async () => {
    fetchMock
      .mockResolvedValueOnce(response(401, '{"code":5002,"message":"expired"}'))
      .mockResolvedValueOnce(response(200));

    await new LivePopupRequestRepository().submit(request, images);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][2]).toEqual(
      expect.objectContaining({Authorization: 'Bearer refreshed'}),
    );
    expect(NativeModules.PopPangHostAuth.getAccessToken).toHaveBeenLastCalledWith('access', true);
  });

  test('5002가 아닌 401이면 만료가 아니라고 넘긴다', async () => {
    fetchMock
      .mockResolvedValueOnce(response(401, '{"code":5001,"message":"invalid"}'))
      .mockResolvedValueOnce(response(200));

    await new LivePopupRequestRepository().submit(request, images);

    expect(NativeModules.PopPangHostAuth.getAccessToken).toHaveBeenLastCalledWith('access', false);
  });

  test('호스트 앱이 다시 로그인해야 한다고 거절하면 다시 보내지 않는다', async () => {
    NativeModules.PopPangHostAuth.getAccessToken = jest.fn((rejectedAccessToken: string | null) =>
      rejectedAccessToken
        ? Promise.reject(new Error('로그인 정보가 만료되었습니다. 다시 로그인해 주세요.'))
        : Promise.resolve('access'),
    );
    fetchMock.mockResolvedValueOnce(response(401, '{"code":5001,"message":"invalid"}'));

    await expect(
      new LivePopupRequestRepository().submit(request, images),
    ).rejects.toThrow('로그인 정보가 만료되었습니다. 다시 로그인해 주세요.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('다시 보내도 401이면 다시 로그인하라는 오류를 전달한다', async () => {
    fetchMock.mockResolvedValue(response(401));

    await expect(
      new LivePopupRequestRepository().submit(request, images),
    ).rejects.toThrow('로그인 정보가 만료되었습니다. 다시 로그인해 주세요.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
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
