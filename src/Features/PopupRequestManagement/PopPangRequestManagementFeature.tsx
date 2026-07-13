import React from 'react';
import {StyleSheet} from 'react-native';
import {
  NavigationContainer,
  NavigationIndependentTree,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import type {PopPangFeatureProps} from '../poppangFeatureProps';
import {LivePopupRequestManagementRepository} from './data/repositories/LivePopupRequestManagementRepository';
import {PopupRequestManagementDetailScreen} from './presentation/PopupRequestManagementDetailScreen';
import {PopupRequestManagementScreen} from './presentation/PopupRequestManagementScreen';
import {
  emitPopPangNativeEvent,
  POPPANG_NATIVE_EVENT,
} from '../../native/PopPangHostAction';

const liveRepository = new LivePopupRequestManagementRepository();

type PopupRequestManagementStackParamList = {
  List: undefined;
  Detail: {submissionId: number};
};

const Stack = createNativeStackNavigator<PopupRequestManagementStackParamList>();

export default function PopPangRequestManagementFeature({
  nativeEvents,
  onDemoBack,
  userUuid,
}: PopPangFeatureProps) {
  const adminUuid = userUuid?.trim() ?? '';
  const canRequestNativeBack =
    Boolean(onDemoBack) ||
    nativeEvents?.includes(
      POPPANG_NATIVE_EVENT.POPUP_REQUEST_MANAGEMENT_BACK,
    );
  const requestNativeBack = React.useCallback(() => {
    if (onDemoBack) {
      onDemoBack();
      return;
    }

    emitPopPangNativeEvent(
      POPPANG_NATIVE_EVENT.POPUP_REQUEST_MANAGEMENT_BACK,
      nativeEvents,
    );
  }, [nativeEvents, onDemoBack]);

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <NavigationIndependentTree>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                animation: 'default',
                contentStyle: styles.content,
                gestureEnabled: true,
                headerShown: false,
              }}>
              <Stack.Screen name="List">
                {({navigation}) => (
                  <PopupRequestManagementScreen
                    adminUuid={adminUuid}
                    onNativeBackPress={
                      canRequestNativeBack ? requestNativeBack : undefined
                    }
                    onSubmissionPress={submissionId =>
                      navigation.navigate('Detail', {submissionId})
                    }
                    repository={liveRepository}
                  />
                )}
              </Stack.Screen>
              <Stack.Screen name="Detail">
                {({navigation, route}) => (
                  <PopupRequestManagementDetailScreen
                    adminUuid={adminUuid}
                    onBack={navigation.goBack}
                    repository={liveRepository}
                    submissionId={route.params.submissionId}
                  />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          </NavigationContainer>
        </NavigationIndependentTree>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  content: {backgroundColor: '#F8F8F8', flex: 1},
  safeArea: {backgroundColor: '#FFFFFF', flex: 1},
});
