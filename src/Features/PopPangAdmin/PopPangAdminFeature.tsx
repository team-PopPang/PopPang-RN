import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import type {PopPangFeatureProps} from '../poppangFeatureProps';

export default function PopPangAdminFeature({userUuid}: PopPangFeatureProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>PopPang Admin</Text>
          <Text style={styles.subtitle}>개발중...</Text>
          <Text style={styles.description}>팝팡 RN의 관리자 화면입니다.</Text>
          <View style={styles.userInfoContainer}>
            <Text style={styles.userInfoLabel}>userUuid</Text>
            <Text style={styles.userInfoValue}>{userUuid ?? '전달되지 않음'}</Text>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {backgroundColor: '#000', flex: 1},
  content: {alignItems: 'center', flex: 1, justifyContent: 'center', padding: 24},
  description: {color: '#aaa', fontSize: 15, marginTop: 24, textAlign: 'center'},
  subtitle: {color: '#aaa', fontSize: 20, marginTop: 12},
  title: {color: '#fff', fontSize: 32, fontWeight: '700'},
  userInfoContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    marginTop: 24,
    minWidth: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  userInfoLabel: {color: '#888', fontSize: 13, marginBottom: 8, textAlign: 'center'},
  userInfoValue: {color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center'},
});
