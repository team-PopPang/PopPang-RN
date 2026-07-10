import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

export default function PopPangRNRoot() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>PopPang RN</Text>
          <Text style={styles.subtitle}>Native Embedded Screen</Text>
          <Text style={styles.description}>
            iOS / Android 앱 안에 삽입될 RN 화면입니다!.
          </Text>
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
});