import type {ComponentType} from 'react';
import PopPangRNRoot from '../Features/PopPangRNRootFeature';
import PopPangAdminFeature from '../Features/PopPangAdminFeature';

export type DemoFeature = {
  id: string;
  title: string;
  description: string;
  component: ComponentType;
};

export const demoFeatures: DemoFeature[] = [
  {
    id: 'poppang-root',
    title: 'PopPang RN Root',
    description: '팝팡 테스트 페이지',
    component: PopPangRNRoot,
  },
  {
    id: 'poppang-admin',
    title: 'PopPang Admin',
    description: '팝팡 관리자 페이지',
    component: PopPangAdminFeature,
  },
];
