import type {
  PopupSubmissionFilter,
  PopupSubmissionListItem,
  PopupSubmissionStatus,
} from '../../domain/entities/PopupSubmissionListItem';
import type {PopupRequestManagementRepository} from '../../domain/repositories/PopupRequestManagementRepository';

const ENDPOINT = 'https://poppang.co.kr/api/v1/admin/popup-submissions';

type PopupSubmissionListResponse = {
  popupSubmissionId: number;
  name: string;
  roadAddress: string;
  region: string;
  submitterUserUuid: string;
  submitterNickname: string;
  submittedAt: string;
  status: PopupSubmissionStatus;
};

function errorMessage(status: number, body: string) {
  try {
    const response = JSON.parse(body) as {message?: string};
    return response.message || `요청에 실패했습니다. (${status})`;
  } catch {
    return `요청에 실패했습니다. (${status})`;
  }
}

export class LivePopupRequestManagementRepository
  implements PopupRequestManagementRepository
{
  async getPopupSubmissions(
    adminUuid: string,
    filter: PopupSubmissionFilter,
  ): Promise<PopupSubmissionListItem[]> {
    const query = new URLSearchParams({status: filter, uuid: adminUuid});
    const response = await fetch(`${ENDPOINT}?${query.toString()}`, {
      headers: {Accept: 'application/json'},
    });
    if (!response.ok) {
      throw new Error(errorMessage(response.status, await response.text()));
    }

    const items = (await response.json()) as PopupSubmissionListResponse[];
    return items.map(item => ({
      id: item.popupSubmissionId,
      name: item.name,
      roadAddress: item.roadAddress,
      region: item.region,
      status: item.status,
      submittedAt: item.submittedAt,
      submitterNickname: item.submitterNickname,
      submitterUserUuid: item.submitterUserUuid,
    }));
  }
}
