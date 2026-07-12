import {
  countByStatus,
  submittedDate,
} from '../src/Features/PopupRequestManagement/application/popupRequestManagement';
import {LivePopupRequestManagementRepository} from '../src/Features/PopupRequestManagement/data/repositories/LivePopupRequestManagementRepository';
import type {PopupSubmissionListItem} from '../src/Features/PopupRequestManagement/domain/entities/PopupSubmissionListItem';

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
