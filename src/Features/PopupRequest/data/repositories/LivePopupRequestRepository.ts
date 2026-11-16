import ReactNativeBlobUtil from 'react-native-blob-util';
import type {
  PopupRequestImage,
  PopupRequestSubmission,
} from '../../domain/entities/PopupRequestForm';
import type {Recommend} from '../../domain/entities/Recommend';
import type {PopupRequestRepository} from '../../domain/repositories/PopupRequestRepository';
import {
  apiErrorMessage,
  authorizedFetch,
  POPPANG_API_BASE_URL,
  requestWithAccessToken,
} from '../../../../api/poppangApi';

type RecommendResponse = {
  id: number;
  recommendName: string;
};

function uploadPath(uri: string) {
  return uri.startsWith('file://')
    ? decodeURIComponent(uri.slice('file://'.length))
    : uri;
}

export class LivePopupRequestRepository implements PopupRequestRepository {
  async getRecommendList(): Promise<Recommend[]> {
    // V2: Access Token으로 부른다. 응답 모양은 V1과 같다.
    const response = await authorizedFetch(`${POPPANG_API_BASE_URL}/recommend`, {
      headers: {Accept: 'application/json'},
    });
    const body = await response.text();
    if (response.status < 200 || response.status >= 300) {
      throw new Error(apiErrorMessage(response.status, body));
    }

    const items = JSON.parse(body) as RecommendResponse[];
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

      // V2: 제보한 사용자는 Access Token으로 정해져 본문에 userUuid를 넣지 않는다.
      const response = await requestWithAccessToken(async authorization => {
        const result = await ReactNativeBlobUtil.fetch(
          'POST',
          `${POPPANG_API_BASE_URL}/popup-submissions`,
          {
            Accept: 'application/json',
            Authorization: authorization,
            'Content-Type': 'multipart/form-data',
          },
          parts,
        );
        return {status: result.info().status, text: () => result.text()};
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error(apiErrorMessage(response.status, await response.text()));
      }
    } finally {
      await ReactNativeBlobUtil.fs.unlink(requestFilePath).catch(() => undefined);
    }
  }
}
