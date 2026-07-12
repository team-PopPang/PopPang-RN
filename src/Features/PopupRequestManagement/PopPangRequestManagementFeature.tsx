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

const liveRepository = new LivePopupRequestManagementRepository();

type PopupRequestManagementStackParamList = {
  List: undefined;
  Detail: {submissionId: number};
};

const Stack = createNativeStackNavigator<PopupRequestManagementStackParamList>();

export default function PopPangRequestManagementFeature({
  userUuid,
}: PopPangFeatureProps) {
  const adminUuid = userUuid?.trim() ?? '';

  return (
    <SafeAreaProvider>
      <SafeAreaView edges={['bottom']} style={styles.container}>
        <NavigationIndependentTree>
          <NavigationContainer>
            <Stack.Navigator
              screenOptions={{
                animation: 'default',
                contentStyle: styles.container,
                gestureEnabled: true,
                headerShown: false,
              }}>
              <Stack.Screen name="List">
                {({navigation}) => (
                  <PopupRequestManagementScreen
                    adminUuid={adminUuid}
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
  container: {backgroundColor: '#F8F8F8', flex: 1},
});
