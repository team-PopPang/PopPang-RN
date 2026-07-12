import type {PopupRequestImage} from '../domain/entities/PopupRequestForm';

const extensionsByMimeType: Record<string, readonly string[]> = {
  'image/heic': ['heic'],
  'image/heif': ['heif'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
};

export function normalizeImageMimeType(mimeType: string) {
  const normalized = mimeType.trim().toLowerCase();
  return normalized === 'image/jpg' ? 'image/jpeg' : normalized;
}

function extensionOf(fileName: string) {
  const dotIndex = fileName.lastIndexOf('.');
  return dotIndex < 0 ? '' : fileName.slice(dotIndex + 1).toLowerCase();
}

export function createUploadImageMetadata(
  fileName: string | undefined,
  mimeType: string,
  index: number,
) {
  const normalizedMimeType = normalizeImageMimeType(mimeType);
  const allowedExtensions = extensionsByMimeType[normalizedMimeType];
  if (!allowedExtensions) return null;

  if (!fileName) {
    return {
      fileName: `popup-request-${Date.now()}-${index}.${allowedExtensions[0]}`,
      mimeType: normalizedMimeType,
    };
  }

  if (!allowedExtensions.includes(extensionOf(fileName))) return null;
  return {fileName, mimeType: normalizedMimeType};
}

export function isUploadableImage(image: PopupRequestImage) {
  if (!image.uri || !image.fileName) return false;
  return createUploadImageMetadata(image.fileName, image.mimeType, 0) !== null;
}
