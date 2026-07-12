import type {
  PopupSubmissionFilter,
  PopupSubmissionListItem,
} from '../entities/PopupSubmissionListItem';

export interface PopupRequestManagementRepository {
  getPopupSubmissions(
    adminUuid: string,
    filter: PopupSubmissionFilter,
  ): Promise<PopupSubmissionListItem[]>;
}
