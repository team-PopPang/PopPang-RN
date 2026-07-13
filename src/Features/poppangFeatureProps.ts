import type {PopPangNativeEvent} from '../native/PopPangHostAction';

export type PopPangFeatureProps = {
  nativeEvents?: readonly PopPangNativeEvent[] | null;
  userUuid?: string | null;
};
