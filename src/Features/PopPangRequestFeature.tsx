import React from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {
  LivePopupRequestRepository,
  PopupRequestScreen,
} from './PopupRequest';
import type {PopPangFeatureProps} from './poppangFeatureProps';

const liveRepository = new LivePopupRequestRepository();

export default function PopPangRequestFeature({
  userUuid,
}: PopPangFeatureProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <PopupRequestScreen
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
