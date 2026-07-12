import type {ComponentType} from 'react';
import type {PopPangFeatureProps} from '../Features/poppangFeatureProps';
import {
  poppangFeatureDefinitions,
  type PopPangFeatureId,
} from '../Features/poppangFeatures';

export type DemoFeature = {
  id: string;
  title: string;
  navigationTitle?: string;
  description: string;
  component: ComponentType<PopPangFeatureProps>;
};

export const demoFeatures: DemoFeature[] = (
  Object.entries(poppangFeatureDefinitions) as [
    PopPangFeatureId,
    (typeof poppangFeatureDefinitions)[PopPangFeatureId],
  ][]
).map(([id, definition]) => ({
  component: definition.component,
  description: definition.description,
  id,
  navigationTitle: definition.navigationTitle,
  title: definition.title,
}));
