import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import type {PopPangFeatureProps} from './poppangFeatureProps';

export default function PopPangAdminFeature({
  userUuid,
}: PopPangFeatureProps) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>PopPang Admin</Text>
          <Text style={styles.subtitle}>개발중...</Text>
          <Text style={styles.description}>
            팝팡 RN의 관리자 화면입니다.
          </Text>
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
  container: {flex: 1, backgroundColor: '#000'},
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {color: '#fff', fontSize: 32, fontWeight: '700'},
  subtitle: {color: '#aaa', marginTop: 12, fontSize: 20},
  description: {
    color: '#aaa',
    marginTop: 24,
    fontSize: 15,
    textAlign: 'center',
  },
  userInfoContainer: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#111',
    minWidth: '100%',
  },
  userInfoLabel: {
    color: '#888',
    fontSize: 13,
    marginBottom: 8,
    textAlign: 'center',
  },
  userInfoValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
