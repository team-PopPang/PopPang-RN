import type {PopupRequestImage} from '../../../PopupRequest/domain/entities/PopupRequestForm';
import type {PopupSubmissionDetail} from './PopupSubmissionDetail';

export type PopupSubmissionAdminImage =
  | {id: string; sourceType: 'EXISTING'; imageUrl: string}
  | ({sourceType: 'UPLOAD'} & PopupRequestImage);

export type PopupSubmissionAdminForm = {
  name: string;
  startDate: string;
  endDate: string;
  roadAddress: string;
  region: string;
  address: string;
  openTime: string;
  closeTime: string;
  latitude: string;
  longitude: string;
  captionSummary: string;
  caption: string;
  mediaType: 'IMAGE' | 'CAROUSEL' | 'VIDEO';
  instaPostUrl: string;
  instaPostId: string;
  geocodingQuery: string;
  selectedRecommendIds: number[];
  images: PopupSubmissionAdminImage[];
};

export type PopupSubmissionAdminImageRequest = {
  sourceType: 'EXISTING' | 'UPLOAD';
  imageUrl?: string;
  fileIndex?: number;
  sortOrder: number;
};

export type PopupSubmissionAdminUpdateRequest = {
  status: 'APPROVED';
  name: string;
  startDate: string;
  endDate: string;
  roadAddress: string;
  region: string;
  address: string;
  openTime: string | null;
  closeTime: string | null;
  latitude: number;
  longitude: number;
  captionSummary: string;
  caption: string;
  mediaType: PopupSubmissionAdminForm['mediaType'];
  instaPostUrl: string | null;
  instaPostId: string | null;
  geocodingQuery: string | null;
  imageList: PopupSubmissionAdminImageRequest[];
  recommendIdList: number[];
};

export type PopupSubmissionAdminUpdateResult = {popupUuid: string | null};

export function adminFormFromDetail(
  detail: PopupSubmissionDetail,
): PopupSubmissionAdminForm {
  const time = (value: PopupSubmissionDetail['openTime']) =>
    value
      ? `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`
      : '';

  return {
    address: detail.address ?? '',
    caption: '',
    captionSummary: '',
    closeTime: time(detail.closeTime),
    endDate: detail.endDate,
    geocodingQuery: '',
    images: detail.imageList.map((image, index) => ({
      id: `existing-${index}-${image.imageUrl}`,
      imageUrl: image.imageUrl,
      sourceType: 'EXISTING',
    })),
    instaPostId: '',
    instaPostUrl: detail.instaPostUrl ?? '',
    latitude: '',
    longitude: '',
    mediaType: detail.imageList.length > 1 ? 'CAROUSEL' : 'IMAGE',
    name: detail.name,
    openTime: time(detail.openTime),
    region: detail.region,
    roadAddress: detail.roadAddress,
    selectedRecommendIds: [...detail.recommendIdList],
    startDate: detail.startDate,
  };
}
