import type {
  PopupSubmissionListItem,
  PopupSubmissionStatus,
} from '../domain/entities/PopupSubmissionListItem';
import type {PopupSubmissionLocalTime} from '../domain/entities/PopupSubmissionDetail';
import type {
  PopupSubmissionAdminForm,
  PopupSubmissionAdminUpdateRequest,
} from '../domain/entities/PopupSubmissionAdminUpdate';

export function submittedDate(value: string) {
  return value.split('T')[0] || value;
}

export function countByStatus(
  items: PopupSubmissionListItem[],
  status: PopupSubmissionStatus,
) {
  return items.filter(item => item.status === status).length;
}

export function localTimeText(value: PopupSubmissionLocalTime | null) {
  if (!value) return '-';
  return `${String(value.hour).padStart(2, '0')}:${String(value.minute).padStart(2, '0')}`;
}

export function absoluteImageUrl(value: string) {
  if (/^https?:\/\//i.test(value)) return value;
  return `https://poppang.co.kr${value.startsWith('/') ? '' : '/'}${value}`;
}

const trimmed = (value: string) => value.trim();
const optional = (value: string) => trimmed(value) || null;
const validTime = (value: string) =>
  value === '' || /^([01]\d|2[0-3]):[0-5]\d$/.test(value);

export function validateAdminApprovalForm(form: PopupSubmissionAdminForm) {
  if (!trimmed(form.name)) return '팝업명을 입력해 주세요.';
  if (form.endDate < form.startDate)
    return '종료일은 시작일보다 빠를 수 없습니다.';
  if (!trimmed(form.roadAddress)) return '도로명 주소를 입력해 주세요.';
  if (!trimmed(form.region)) return '지역을 입력해 주세요.';
  if (!trimmed(form.address)) return '지번 주소를 입력해 주세요.';
  if (!trimmed(form.latitude) || Number.isNaN(Number(form.latitude)))
    return '위도를 숫자로 입력해 주세요.';
  if (!trimmed(form.longitude) || Number.isNaN(Number(form.longitude)))
    return '경도를 숫자로 입력해 주세요.';
  if (!trimmed(form.captionSummary)) return '팝업 한줄 소개를 입력해 주세요.';
  if (!trimmed(form.caption)) return '팝업 상세 소개를 입력해 주세요.';
  if (!form.selectedRecommendIds.length)
    return '추천 카테고리를 1개 이상 선택해 주세요.';
  if (!form.images.length) return '이미지를 1개 이상 등록해 주세요.';
  if (!validTime(trimmed(form.openTime)))
    return '오픈 시간을 HH:mm 형식으로 입력해 주세요.';
  if (!validTime(trimmed(form.closeTime)))
    return '마감 시간을 HH:mm 형식으로 입력해 주세요.';
  return null;
}

export function mapAdminApprovalRequest(
  form: PopupSubmissionAdminForm,
): PopupSubmissionAdminUpdateRequest {
  let uploadIndex = 0;
  return {
    address: trimmed(form.address),
    caption: trimmed(form.caption),
    captionSummary: trimmed(form.captionSummary),
    closeTime: optional(form.closeTime),
    endDate: form.endDate,
    geocodingQuery: optional(form.geocodingQuery),
    imageList: form.images.map((image, sortOrder) => {
      if (image.sourceType === 'EXISTING') {
        return {
          imageUrl: image.imageUrl,
          sortOrder,
          sourceType: 'EXISTING' as const,
        };
      }
      return {
        fileIndex: uploadIndex++,
        sortOrder,
        sourceType: 'UPLOAD' as const,
      };
    }),
    instaPostId: optional(form.instaPostId),
    instaPostUrl: optional(form.instaPostUrl),
    latitude: Number(form.latitude),
    longitude: Number(form.longitude),
    mediaType: form.mediaType,
    name: trimmed(form.name),
    openTime: optional(form.openTime),
    recommendIdList: [...form.selectedRecommendIds].sort((a, b) => a - b),
    region: trimmed(form.region),
    roadAddress: trimmed(form.roadAddress),
    startDate: form.startDate,
    status: 'APPROVED',
  };
}
