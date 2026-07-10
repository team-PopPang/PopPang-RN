import React from 'react';
import {
  poppangFeatureDefinitions,
  resolvePopPangFeature,
} from './Features/poppangFeatures';

type PopPangNativeEntryProps = {
  feature?: string | null;
  rootTag?: number;
};

export default function PopPangNativeEntry(props: PopPangNativeEntryProps) {
  const featureId = resolvePopPangFeature(props.feature);
  const SelectedComponent = poppangFeatureDefinitions[featureId].component;

  return <SelectedComponent />;
}
