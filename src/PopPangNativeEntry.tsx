import React from 'react';
import type {PopPangFeatureProps} from './Features/poppangFeatureProps';
import {
  poppangFeatureDefinitions,
  resolvePopPangFeature,
} from './Features/poppangFeatures';

type PopPangNativeEntryProps = PopPangFeatureProps & {
  feature?: string | null;
  rootTag?: number;
};

export default function PopPangNativeEntry(props: PopPangNativeEntryProps) {
  const featureId = resolvePopPangFeature(props.feature);
  const SelectedComponent = poppangFeatureDefinitions[featureId].component;

  return (
    <SelectedComponent
      nativeEvents={props.nativeEvents}
      userUuid={props.userUuid}
    />
  );
}
