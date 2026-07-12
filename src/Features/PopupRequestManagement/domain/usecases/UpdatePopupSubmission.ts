import type {PopupSubmissionAdminForm} from '../entities/PopupSubmissionAdminUpdate';
import type {PopupRequestManagementRepository} from '../repositories/PopupRequestManagementRepository';

export class UpdatePopupSubmission {
  constructor(private readonly repository: PopupRequestManagementRepository) {}

  execute(
    adminUuid: string,
    submissionId: number,
    status: 'APPROVED' | 'REJECTED',
    form?: PopupSubmissionAdminForm,
  ) {
    return this.repository.updatePopupSubmission(
      adminUuid,
      submissionId,
      status,
      form,
    );
  }
}
