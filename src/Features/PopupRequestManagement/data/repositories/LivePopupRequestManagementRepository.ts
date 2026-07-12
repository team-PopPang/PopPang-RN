import type {
  PopupSubmissionFilter,
  PopupSubmissionListItem,
  PopupSubmissionStatus,
} from '../../domain/entities/PopupSubmissionListItem';
import type {
  PopupSubmissionDetail,
  PopupSubmissionLocalTime,
} from '../../domain/entities/PopupSubmissionDetail';
import type {PopupRequestManagementRepository} from '../../domain/repositories/PopupRequestManagementRepository';
import type {Recommend} from '../../../PopupRequest/domain/entities/Recommend';
import type {
  PopupSubmissionAdminForm,
  PopupSubmissionAdminUpdateResult,
} from '../../domain/entities/PopupSubmissionAdminUpdate';

const ENDPOINT = 'https://poppang.co.kr/api/v1/admin/popup-submissions';
const RECOMMEND_ENDPOINT = 'https://poppang.co.kr/api/v1/recommend';

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

type PopupSubmissionDetailResponse = {
  popupSubmissionId: number;
  name: string;
  startDate: string;
  endDate: string;
  roadAddress: string;
  region: string;
  description: string;
  recommendIdList: number[];
  recommendList: {recommendId: number; recommendName: string}[];
  imageList: {imageUrl: string; sortOrder: number}[];
  address: string | null;
  openTime: PopupSubmissionLocalTime | null;
  closeTime: PopupSubmissionLocalTime | null;
  instaPostUrl: string | null;
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

function uploadPath(uri: string) {
  return uri.startsWith('file://')
    ? decodeURIComponent(uri.slice('file://'.length))
    : uri;
}

export class LivePopupRequestManagementRepository
  implements PopupRequestManagementRepository
{
  async getRecommendList(): Promise<Recommend[]> {
    const response = await fetch(RECOMMEND_ENDPOINT, {
      headers: {Accept: 'application/json'},
    });
    if (!response.ok) {
      throw new Error(errorMessage(response.status, await response.text()));
    }
    const items = (await response.json()) as {
      id: number;
      recommendName: string;
    }[];
    return items.map(item => ({id: item.id, name: item.recommendName}));
  }

  async getPopupSubmissionDetail(
    adminUuid: string,
    submissionId: number,
  ): Promise<PopupSubmissionDetail> {
    const query = new URLSearchParams({uuid: adminUuid});
    const response = await fetch(`${ENDPOINT}/${submissionId}?${query}`, {
      headers: {Accept: 'application/json'},
    });
    if (!response.ok) {
      throw new Error(errorMessage(response.status, await response.text()));
    }

    const item = (await response.json()) as PopupSubmissionDetailResponse;
    return {
      address: item.address,
      closeTime: item.closeTime,
      description: item.description,
      endDate: item.endDate,
      id: item.popupSubmissionId,
      imageList: [...item.imageList].sort((a, b) => a.sortOrder - b.sortOrder),
      instaPostUrl: item.instaPostUrl,
      name: item.name,
      openTime: item.openTime,
      recommendIdList: item.recommendIdList,
      recommendList: item.recommendList.map(recommend => ({
        id: recommend.recommendId,
        name: recommend.recommendName,
      })),
      region: item.region,
      roadAddress: item.roadAddress,
      startDate: item.startDate,
      status: item.status,
    };
  }

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

  async updatePopupSubmission(
    adminUuid: string,
    submissionId: number,
    status: 'APPROVED' | 'REJECTED',
    form?: PopupSubmissionAdminForm,
  ): Promise<PopupSubmissionAdminUpdateResult> {
    if (status === 'APPROVED' && !form) {
      throw new Error('승인할 팝업 정보를 확인할 수 없습니다.');
    }

    const request =
      status === 'REJECTED'
        ? {status: 'REJECTED' as const}
        : mapAdminApprovalRequest(form!);
    const requestFilePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/popup-admin-update-${Date.now()}.json`;
    await ReactNativeBlobUtil.fs.writeFile(
      requestFilePath,
      JSON.stringify(request),
      'utf8',
    );

    try {
      const uploadImages =
        form?.images.filter(image => image.sourceType === 'UPLOAD') ?? [];
      const parts = [
        {
          data: ReactNativeBlobUtil.wrap(requestFilePath),
          filename: 'request.json',
          name: 'request',
          type: 'application/json',
        },
        ...uploadImages.map(image => ({
          data: ReactNativeBlobUtil.wrap(uploadPath(image.uri)),
          filename: image.fileName,
          name: 'images',
          type: image.mimeType,
        })),
      ];
      const query = new URLSearchParams({uuid: adminUuid});
      const response = await ReactNativeBlobUtil.fetch(
        'PUT',
        `${ENDPOINT}/${submissionId}?${query}`,
        {Accept: 'application/json', 'Content-Type': 'multipart/form-data'},
        parts,
      );
      const responseStatus = response.info().status;
      if (responseStatus < 200 || responseStatus >= 300) {
        throw new Error(
          errorMessage(responseStatus, await response.text()),
        );
      }
      return JSON.parse(await response.text()) as PopupSubmissionAdminUpdateResult;
    } finally {
      await ReactNativeBlobUtil.fs.unlink(requestFilePath).catch(() => undefined);
    }
  }
}
import ReactNativeBlobUtil from 'react-native-blob-util';
import {mapAdminApprovalRequest} from '../../application/popupRequestManagement';
