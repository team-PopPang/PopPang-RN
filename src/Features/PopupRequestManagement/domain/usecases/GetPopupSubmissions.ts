import type {PopupSubmissionFilter} from '../entities/PopupSubmissionListItem';
import type {PopupRequestManagementRepository} from '../repositories/PopupRequestManagementRepository';

export class GetPopupSubmissions {
  constructor(private readonly repository: PopupRequestManagementRepository) {}

  execute(adminUuid: string, filter: PopupSubmissionFilter) {
    return this.repository.getPopupSubmissions(adminUuid, filter);
  }
}
