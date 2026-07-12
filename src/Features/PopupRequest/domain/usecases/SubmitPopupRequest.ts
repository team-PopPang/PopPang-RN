import type {
  PopupRequestImage,
  PopupRequestSubmission,
} from '../entities/PopupRequestForm';
import type {PopupRequestRepository} from '../repositories/PopupRequestRepository';

export class SubmitPopupRequest {
  constructor(private readonly repository: PopupRequestRepository) {}

  execute(request: PopupRequestSubmission, images: PopupRequestImage[]) {
    return this.repository.submit(request, images);
  }
}
