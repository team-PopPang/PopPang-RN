import type {
  PopupSubmissionListItem,
  PopupSubmissionStatus,
} from '../domain/entities/PopupSubmissionListItem';

export function submittedDate(value: string) {
  return value.split('T')[0] || value;
}

export function countByStatus(
  items: PopupSubmissionListItem[],
  status: PopupSubmissionStatus,
) {
  return items.filter(item => item.status === status).length;
}
