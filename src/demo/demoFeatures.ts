import type {ComponentType} from 'react';
import {
  poppangFeatureDefinitions,
  type PopPangFeatureId,
} from '../Features/poppangFeatures';

export type DemoFeature = {
  id: string;
  title: string;
  description: string;
  component: ComponentType;
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
  title: definition.title,
}));
