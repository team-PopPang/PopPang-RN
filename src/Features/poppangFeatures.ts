import type {ComponentType} from 'react';
import PopPangAdminFeature from './PopPangAdminFeature';
import PopPangRNRootFeature from './PopPangRNRootFeature';

export const POPPANG_FEATURE = {
  ADMIN: 'admin',
  ROOT: 'root',
} as const;

export type PopPangFeatureId =
  (typeof POPPANG_FEATURE)[keyof typeof POPPANG_FEATURE];

type PopPangFeatureDefinition = {
  component: ComponentType;
  description: string;
  title: string;
};

export const poppangFeatureDefinitions: Record<
  PopPangFeatureId,
  PopPangFeatureDefinition
> = {
  [POPPANG_FEATURE.ROOT]: {
    component: PopPangRNRootFeature,
    description: '팝팡 테스트 페이지',
    title: 'PopPang RN Root',
  },
  [POPPANG_FEATURE.ADMIN]: {
    component: PopPangAdminFeature,
    description: '팝팡 관리자 페이지',
    title: 'PopPang Admin',
  },
};

const featureAliases: Record<string, PopPangFeatureId> = {
  admin: POPPANG_FEATURE.ADMIN,
  'poppang-admin': POPPANG_FEATURE.ADMIN,
  PopPangAdminFeature: POPPANG_FEATURE.ADMIN,
  root: POPPANG_FEATURE.ROOT,
  'poppang-root': POPPANG_FEATURE.ROOT,
  PopPangRNRoot: POPPANG_FEATURE.ROOT,
  PopPangRNRootFeature: POPPANG_FEATURE.ROOT,
};

export function resolvePopPangFeature(
  feature?: string | null,
): PopPangFeatureId {
  if (!feature) {
    return POPPANG_FEATURE.ROOT;
  }

  return featureAliases[feature] ?? POPPANG_FEATURE.ROOT;
}
