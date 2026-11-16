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

// V2: 관리자 여부는 Access Token의 사용자로 서버가 판단한다. 관리자 uuid를 query로 보내지 않는다.
const ENDPOINT = `${POPPANG_API_BASE_URL}/admin/popup-submissions`;
const RECOMMEND_ENDPOINT = `${POPPANG_API_BASE_URL}/recommend`;

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

function uploadPath(uri: string) {
  return uri.startsWith('file://')
    ? decodeURIComponent(uri.slice('file://'.length))
    : uri;
}

export class LivePopupRequestManagementRepository
  implements PopupRequestManagementRepository
{
  async getRecommendList(): Promise<Recommend[]> {
    const response = await authorizedFetch(RECOMMEND_ENDPOINT, {
      headers: {Accept: 'application/json'},
    });
    const body = await response.text();
    if (response.status < 200 || response.status >= 300) {
      throw new Error(apiErrorMessage(response.status, body));
    }
    const items = JSON.parse(body) as {
      id: number;
      recommendName: string;
    }[];
    return items.map(item => ({id: item.id, name: item.recommendName}));
  }

  async getPopupSubmissionDetail(
    _adminUuid: string,
    submissionId: number,
  ): Promise<PopupSubmissionDetail> {
    const response = await authorizedFetch(`${ENDPOINT}/${submissionId}`, {
      headers: {Accept: 'application/json'},
    });
    const body = await response.text();
    if (response.status < 200 || response.status >= 300) {
      throw new Error(apiErrorMessage(response.status, body));
    }

    const item = JSON.parse(body) as PopupSubmissionDetailResponse;
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
    _adminUuid: string,
    filter: PopupSubmissionFilter,
  ): Promise<PopupSubmissionListItem[]> {
    const query = new URLSearchParams({status: filter});
    const response = await authorizedFetch(`${ENDPOINT}?${query.toString()}`, {
      headers: {Accept: 'application/json'},
    });
    const body = await response.text();
    if (response.status < 200 || response.status >= 300) {
      throw new Error(apiErrorMessage(response.status, body));
    }

    const items = JSON.parse(body) as PopupSubmissionListResponse[];
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
    _adminUuid: string,
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
      const response = await requestWithAccessToken(async authorization => {
        const result = await ReactNativeBlobUtil.fetch(
          'PUT',
          `${ENDPOINT}/${submissionId}`,
          {
            Accept: 'application/json',
            Authorization: authorization,
            'Content-Type': 'multipart/form-data',
          },
          parts,
        );
        return {status: result.info().status, text: () => result.text()};
      });
      const body = await response.text();
      if (response.status < 200 || response.status >= 300) {
        throw new Error(apiErrorMessage(response.status, body));
      }
      return JSON.parse(body) as PopupSubmissionAdminUpdateResult;
    } finally {
      await ReactNativeBlobUtil.fs.unlink(requestFilePath).catch(() => undefined);
    }
  }
}
import ReactNativeBlobUtil from 'react-native-blob-util';
import {
  apiErrorMessage,
  authorizedFetch,
  POPPANG_API_BASE_URL,
  requestWithAccessToken,
} from '../../../../api/poppangApi';
import {mapAdminApprovalRequest} from '../../application/popupRequestManagement';
