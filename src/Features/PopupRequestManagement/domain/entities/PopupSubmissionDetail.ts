import type {PopupSubmissionStatus} from './PopupSubmissionListItem';

export type PopupSubmissionLocalTime = {
  hour: number;
  minute: number;
  second?: number;
  nano?: number;
};

export type PopupSubmissionDetail = {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  roadAddress: string;
  region: string;
  description: string;
  recommendIdList: number[];
  recommendList: {id: number; name: string}[];
  imageList: {imageUrl: string; sortOrder: number}[];
  address: string | null;
  openTime: PopupSubmissionLocalTime | null;
  closeTime: PopupSubmissionLocalTime | null;
  instaPostUrl: string | null;
  status: PopupSubmissionStatus;
};
