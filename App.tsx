// /**
//  * Sample React Native App
//  * https://github.com/facebook/react-native
//  *
//  * @format
//  */

// https://reactnative.dev/docs/0.81/safeareaview?utm_source=chatgpt.com
import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';

function App() {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>PopPang RN</Text>
          <Text style={styles.subtitle}>Demo App</Text>
          <Text style={styles.description}>
            iOS / Android 공용 기능을 개발하는 공간입니다.
          </Text>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  subtitle: {
    color: '#aaa',
    marginTop: 12,
    fontSize: 20,
  },
  description: {
    color: '#aaa',
    marginTop: 24,
    fontSize: 15,
    textAlign: 'center',
  },
});

export default App;