import type {PopPangNativeEvent} from '../native/PopPangHostAction';

export type PopPangFeatureProps = {
  /** RN 단독 데모에서 네이티브 뒤로가기 동작을 대신한다. */
  onDemoBack?: () => void;
  nativeEvents?: readonly PopPangNativeEvent[] | null;
  userUuid?: string | null;
};
