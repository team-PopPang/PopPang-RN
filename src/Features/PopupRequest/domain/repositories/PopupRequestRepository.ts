import type {
  PopupRequestImage,
  PopupRequestSubmission,
} from '../entities/PopupRequestForm';
import type {Recommend} from '../entities/Recommend';

export interface PopupRequestRepository {
  getRecommendList(): Promise<Recommend[]>;
  submit(
    request: PopupRequestSubmission,
    images: PopupRequestImage[],
  ): Promise<void>;
}
