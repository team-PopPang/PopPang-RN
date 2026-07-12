import type {PopupRequestManagementRepository} from '../repositories/PopupRequestManagementRepository';

export class GetPopupSubmissionDetail {
  constructor(private readonly repository: PopupRequestManagementRepository) {}

  execute(adminUuid: string, submissionId: number) {
    return this.repository.getPopupSubmissionDetail(adminUuid, submissionId);
  }
}
