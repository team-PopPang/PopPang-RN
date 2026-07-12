import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  countByStatus,
  mapAdminApprovalRequest,
  submittedDate,
  validateAdminApprovalForm,
} from '../src/Features/PopupRequestManagement/application/popupRequestManagement';
import {LivePopupRequestManagementRepository} from '../src/Features/PopupRequestManagement/data/repositories/LivePopupRequestManagementRepository';
import type {PopupSubmissionListItem} from '../src/Features/PopupRequestManagement/domain/entities/PopupSubmissionListItem';
import type {PopupSubmissionAdminForm} from '../src/Features/PopupRequestManagement/domain/entities/PopupSubmissionAdminUpdate';

const responseItem = {
  name: '성수 팝업',
  popupSubmissionId: 7,
  region: '서울',
  roadAddress: '서울 성동구 성수이로 1',
  status: 'PENDING',
  submittedAt: '2026-07-12T13:59:06',
  submitterNickname: '팝팡이',
  submitterUserUuid: 'user-uuid',
} as const;

describe('LivePopupRequestManagementRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
  });

  test('관리자 UUID와 한글 상태 필터로 목록을 조회하고 응답을 매핑한다', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue([responseItem]),
      ok: true,
    });

    const items = await new LivePopupRequestManagementRepository().getPopupSubmissions(
      'admin-uuid',
      '대기',
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://poppang.co.kr/api/v1/admin/popup-submissions?status=%EB%8C%80%EA%B8%B0&uuid=admin-uuid',
      {headers: {Accept: 'application/json'}},
    );
    expect(items).toEqual([
      {
        id: 7,
        name: '성수 팝업',
        region: '서울',
        roadAddress: '서울 성동구 성수이로 1',
        status: 'PENDING',
        submittedAt: '2026-07-12T13:59:06',
        submitterNickname: '팝팡이',
        submitterUserUuid: 'user-uuid',
      },
    ]);
  });

  test('서버 오류 메시지를 화면에 전달한다', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 403,
      text: jest.fn().mockResolvedValue(
        JSON.stringify({message: '관리자 권한이 필요합니다.'}),
      ),
    });

    await expect(
      new LivePopupRequestManagementRepository().getPopupSubmissions(
        'member-uuid',
        '전체',
      ),
    ).rejects.toThrow('관리자 권한이 필요합니다.');
  });

  test('제보 ID와 관리자 UUID로 상세를 조회하고 이미지와 추천을 매핑한다', async () => {
    (globalThis.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue({
        address: null,
        closeTime: {hour: 20, minute: 0},
        description: '원본 제보 내용',
        endDate: '2026-07-19',
        imageList: [
          {imageUrl: '/submissionImages/second.jpg', sortOrder: 1},
          {imageUrl: '/submissionImages/first.jpg', sortOrder: 0},
        ],
        instaPostUrl: null,
        name: '성수 팝업',
        openTime: {hour: 10, minute: 0},
        popupSubmissionId: 7,
        recommendIdList: [3],
        recommendList: [{recommendId: 3, recommendName: '패션'}],
        region: '서울',
        roadAddress: '서울 성동구 성수이로 1',
        startDate: '2026-07-12',
        status: 'PENDING',
      }),
      ok: true,
    });

    const detail = await new LivePopupRequestManagementRepository().getPopupSubmissionDetail(
      'admin-uuid',
      7,
    );

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://poppang.co.kr/api/v1/admin/popup-submissions/7?uuid=admin-uuid',
      {headers: {Accept: 'application/json'}},
    );
    expect(detail.recommendList).toEqual([{id: 3, name: '패션'}]);
    expect(detail.imageList.map(item => item.sortOrder)).toEqual([0, 1]);
    expect(detail.openTime).toEqual({hour: 10, minute: 0});
  });

  test('승인 요청을 JSON과 새 이미지 multipart로 전송한다', async () => {
    const blobFetch = ReactNativeBlobUtil.fetch as jest.Mock;
    blobFetch.mockResolvedValue({
      info: () => ({status: 200}),
      text: jest.fn().mockResolvedValue(JSON.stringify({popupUuid: 'popup-1'})),
    });

    const result = await new LivePopupRequestManagementRepository().updatePopupSubmission(
      'admin-uuid',
      7,
      'APPROVED',
      validAdminForm(),
    );

    expect(result).toEqual({popupUuid: 'popup-1'});
    expect(blobFetch).toHaveBeenCalledWith(
      'PUT',
      'https://poppang.co.kr/api/v1/admin/popup-submissions/7?uuid=admin-uuid',
      {Accept: 'application/json', 'Content-Type': 'multipart/form-data'},
      expect.arrayContaining([
        expect.objectContaining({name: 'request', type: 'application/json'}),
        expect.objectContaining({
          filename: 'new.jpg',
          name: 'images',
          type: 'image/jpeg',
        }),
      ]),
    );
  });

  test('반려 요청에는 이미지 파트를 포함하지 않는다', async () => {
    const blobFetch = ReactNativeBlobUtil.fetch as jest.Mock;
    blobFetch.mockResolvedValue({
      info: () => ({status: 200}),
      text: jest.fn().mockResolvedValue(JSON.stringify({popupUuid: null})),
    });

    await new LivePopupRequestManagementRepository().updatePopupSubmission(
      'admin-uuid',
      7,
      'REJECTED',
    );

    const parts = blobFetch.mock.calls[0][3];
    expect(parts).toHaveLength(1);
    expect(ReactNativeBlobUtil.fs.writeFile).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({status: 'REJECTED'}),
      'utf8',
    );
  });
});

function validAdminForm(): PopupSubmissionAdminForm {
  return {
    address: '서울 성동구 성수동 1',
    caption: '팝업 상세 소개',
    captionSummary: '팝업 한줄 소개',
    closeTime: '20:00',
    endDate: '2026-07-19',
    geocodingQuery: '',
    images: [
      {id: 'old', imageUrl: '/submissionImages/old.jpg', sourceType: 'EXISTING'},
      {
        fileName: 'new.jpg',
        id: 'new',
        mimeType: 'image/jpeg',
        sourceType: 'UPLOAD',
        uri: 'file:///tmp/new.jpg',
      },
    ],
    instaPostId: '',
    instaPostUrl: '',
    latitude: '37.544',
    longitude: '127.055',
    mediaType: 'CAROUSEL',
    name: '성수 팝업',
    openTime: '10:00',
    region: '서울',
    roadAddress: '서울 성동구 성수이로 1',
    selectedRecommendIds: [3, 1],
    startDate: '2026-07-12',
  };
}

test('승인 폼의 기존 이미지와 새 이미지 fileIndex를 구분한다', () => {
  const form = validAdminForm();
  expect(validateAdminApprovalForm(form)).toBeNull();
  expect(mapAdminApprovalRequest(form).imageList).toEqual([
    {
      imageUrl: '/submissionImages/old.jpg',
      sortOrder: 0,
      sourceType: 'EXISTING',
    },
    {fileIndex: 0, sortOrder: 1, sourceType: 'UPLOAD'},
  ]);
});

test('상태별 개수와 제출 날짜를 Swift 화면과 동일하게 표시한다', () => {
  const item = {
    id: 7,
    name: '성수 팝업',
    region: '서울',
    roadAddress: '서울 성동구 성수이로 1',
    status: 'PENDING',
    submittedAt: '2026-07-12T13:59:06',
    submitterNickname: '팝팡이',
    submitterUserUuid: 'user-uuid',
  } satisfies PopupSubmissionListItem;

  expect(countByStatus([item], 'PENDING')).toBe(1);
  expect(countByStatus([item], 'APPROVED')).toBe(0);
  expect(submittedDate(item.submittedAt)).toBe('2026-07-12');
});
