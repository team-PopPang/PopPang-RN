import ReactNativeBlobUtil from 'react-native-blob-util';
import type {
  PopupRequestImage,
  PopupRequestSubmission,
} from '../../domain/entities/PopupRequestForm';
import type {Recommend} from '../../domain/entities/Recommend';
import type {PopupRequestRepository} from '../../domain/repositories/PopupRequestRepository';

const API_BASE_URL = 'https://poppang.co.kr/api/v1';

type RecommendResponse = {
  id: number;
  recommendName: string;
};

function errorMessage(status: number, body: string) {
  try {
    const response = JSON.parse(body) as {message?: string};
    return response.message || `요청에 실패했습니다. (${status})`;
  } catch {
    return `요청에 실패했습니다. (${status})`;
  }
}

function uploadPath(uri: string) {
  return uri.startsWith('file://')
    ? decodeURIComponent(uri.slice('file://'.length))
    : uri;
}

export class LivePopupRequestRepository implements PopupRequestRepository {
  async getRecommendList(): Promise<Recommend[]> {
    const response = await fetch(`${API_BASE_URL}/recommend`, {
      headers: {Accept: 'application/json'},
    });
    if (!response.ok) {
      throw new Error(errorMessage(response.status, await response.text()));
    }

    const items = (await response.json()) as RecommendResponse[];
    return items.map(item => ({id: item.id, name: item.recommendName}));
  }

  async submit(
    request: PopupRequestSubmission,
    images: PopupRequestImage[],
  ): Promise<void> {
    const requestFilePath = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/popup-request-${Date.now()}.json`;
    await ReactNativeBlobUtil.fs.writeFile(
      requestFilePath,
      JSON.stringify(request),
      'utf8',
    );

    try {
      const parts = [
        {
          data: ReactNativeBlobUtil.wrap(requestFilePath),
          filename: 'request.json',
          name: 'request',
          type: 'application/json',
        },
        ...images.map(image => ({
          data: ReactNativeBlobUtil.wrap(uploadPath(image.uri)),
          filename: image.fileName,
          name: 'images',
          type: image.mimeType,
        })),
      ];

      const response = await ReactNativeBlobUtil.fetch(
        'POST',
        `${API_BASE_URL}/popup-submissions`,
        {Accept: 'application/json', 'Content-Type': 'multipart/form-data'},
        parts,
      );

      const status = response.info().status;
      if (status < 200 || status >= 300) {
        throw new Error(errorMessage(status, await response.text()));
      }
    } finally {
      await ReactNativeBlobUtil.fs.unlink(requestFilePath).catch(() => undefined);
    }
  }
}
