import React from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {LivePopupRequestRepository} from './data/repositories/LivePopupRequestRepository';
import {PopupRequestScreen} from './presentation/PopupRequestScreen';
import type {PopPangFeatureProps} from '../poppangFeatureProps';

const liveRepository = new LivePopupRequestRepository();

export default function PopPangRequestFeature({
  nativeEvents,
  onDemoBack,
  userUuid,
}: PopPangFeatureProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top', 'bottom']} style={styles.container}>
        <PopupRequestScreen
          nativeEvents={nativeEvents}
          onDemoBack={onDemoBack}
          repository={liveRepository}
          userUuid={userUuid ?? (__DEV__ ? 'preview-user' : '')}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
});
