import React from 'react';
import {StyleSheet} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import type {PopPangFeatureProps} from './poppangFeatureProps';
import {
  LivePopupRequestManagementRepository,
  PopupRequestManagementScreen,
} from './PopupRequestManagement';

const liveRepository = new LivePopupRequestManagementRepository();

export default function PopPangRequestManagementFeature({
  userUuid,
}: PopPangFeatureProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <PopupRequestManagementScreen
          adminUuid={userUuid?.trim() ?? ''}
          repository={liveRepository}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {backgroundColor: '#F8F8F8', flex: 1},
});
