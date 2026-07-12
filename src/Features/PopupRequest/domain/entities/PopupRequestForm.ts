export type PopupRequestImage = {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  width?: number;
  height?: number;
  fileSize?: number;
};

export type PopupRequestForm = {
  name: string;
  startDate: string;
  endDate: string;
  roadAddress: string;
  region: string;
  description: string;
  selectedRecommendIds: number[];
  images: PopupRequestImage[];
  address: string;
  openTime: string;
  closeTime: string;
  latitude: string;
  longitude: string;
  instagramUrl: string;
};

export type PopupRequestSubmission = {
  userUuid: string;
  name: string;
  startDate: string;
  endDate: string;
  openTime: string | null;
  closeTime: string | null;
  address: string;
  roadAddress: string;
  region: string;
  instaPostUrl: string | null;
  description: string;
  imageList: [];
  recommendIdList: number[];
};
