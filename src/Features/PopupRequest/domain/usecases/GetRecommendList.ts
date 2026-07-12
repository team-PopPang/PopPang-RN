import type {PopupRequestRepository} from '../repositories/PopupRequestRepository';

export class GetRecommendList {
  constructor(private readonly repository: PopupRequestRepository) {}

  execute() {
    return this.repository.getRecommendList();
  }
}
