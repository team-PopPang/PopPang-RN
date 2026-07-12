import type {
  PopupSubmissionFilter,
  PopupSubmissionListItem,
} from '../entities/PopupSubmissionListItem';
import type {PopupSubmissionDetail} from '../entities/PopupSubmissionDetail';
import type {Recommend} from '../../../PopupRequest/domain/entities/Recommend';
import type {
  PopupSubmissionAdminForm,
  PopupSubmissionAdminUpdateResult,
} from '../entities/PopupSubmissionAdminUpdate';

export interface PopupRequestManagementRepository {
  getRecommendList(): Promise<Recommend[]>;
  getPopupSubmissionDetail(
    adminUuid: string,
    submissionId: number,
  ): Promise<PopupSubmissionDetail>;
  getPopupSubmissions(
    adminUuid: string,
    filter: PopupSubmissionFilter,
  ): Promise<PopupSubmissionListItem[]>;
  updatePopupSubmission(
    adminUuid: string,
    submissionId: number,
    status: 'APPROVED' | 'REJECTED',
    form?: PopupSubmissionAdminForm,
  ): Promise<PopupSubmissionAdminUpdateResult>;
}
