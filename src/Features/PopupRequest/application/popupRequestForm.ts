import type {
  PopupRequestForm,
  PopupRequestSubmission,
} from '../domain/entities/PopupRequestForm';
import {isUploadableImage} from './popupRequestImage';

const pad = (value: number) => String(value).padStart(2, '0');

export const formatDate = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const createInitialPopupRequestForm = (): PopupRequestForm => {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 7);

  return {
    name: '',
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
    roadAddress: '',
    region: '',
    description: '',
    selectedRecommendIds: [],
    images: [],
    address: '',
    openTime: '',
    closeTime: '',
    latitude: '',
    longitude: '',
    instagramUrl: '',
  };
};

const trimmed = (value: string) => value.trim();
const validTime = (value: string) =>
  value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
const validOptionalUrl = (value: string) =>
  value === '' || /^https?:\/\/\S+$/i.test(value);
const mapTime = (value: string) => {
  const normalized = trimmed(value);
  if (!normalized) return null;
  const [hour, minute] = normalized.split(':').map(Number);
  return {hour, minute, nano: 0, second: 0};
};

export function validatePopupRequest(form: PopupRequestForm, userUuid: string) {
  if (!userUuid.trim()) return '사용자 정보를 확인할 수 없습니다.';
  if (!trimmed(form.name)) return '팝업명을 입력해 주세요.';
  if (!trimmed(form.roadAddress)) return '도로명 주소를 입력해 주세요.';
  if (!trimmed(form.region)) return '지역을 입력해 주세요.';
  if (!trimmed(form.description)) return '제보 내용을 입력해 주세요.';
  if (!form.selectedRecommendIds.length)
    return '추천 카테고리를 1개 이상 선택해 주세요.';
  if (form.endDate < form.startDate)
    return '종료일은 시작일보다 빠를 수 없습니다.';
  if (!form.images.length) return '이미지를 1개 이상 선택해 주세요.';
  if (form.images.some(image => !isUploadableImage(image)))
    return '지원하지 않거나 파일 정보가 올바르지 않은 이미지가 있습니다.';
  if (!validTime(trimmed(form.openTime)))
    return '오픈 시간을 HH:mm 형식으로 입력해 주세요.';
  if (!validTime(trimmed(form.closeTime)))
    return '마감 시간을 HH:mm 형식으로 입력해 주세요.';
  if (!validOptionalUrl(trimmed(form.instagramUrl)))
    return '인스타그램 URL을 올바르게 입력해 주세요.';
  return null;
}

export function mapPopupRequest(
  form: PopupRequestForm,
  userUuid: string,
): PopupRequestSubmission {
  const instagramUrl = trimmed(form.instagramUrl);

  return {
    userUuid,
    name: trimmed(form.name),
    startDate: form.startDate,
    endDate: form.endDate,
    openTime: mapTime(form.openTime),
    closeTime: mapTime(form.closeTime),
    address: trimmed(form.address) || trimmed(form.roadAddress),
    roadAddress: trimmed(form.roadAddress),
    region: trimmed(form.region),
    instaPostUrl: instagramUrl || null,
    description: trimmed(form.description),
    recommendIdList: [...form.selectedRecommendIds].sort((a, b) => a - b),
  };
}
