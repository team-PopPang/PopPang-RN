// /**
//  * Sample React Native App
//  * https://github.com/facebook/react-native
//  *
//  * @format
//  */

// https://reactnative.dev/docs/0.81/safeareaview?
import React from 'react';
import DemoFeatureCatalog from './src/demo/DemoFeatureCatalog';
import {PopPangRNRootFeature as PopPangRNRoot} from './src/Features/PopPangRNRoot';

export default function App() {
  if (__DEV__) {
    return <DemoFeatureCatalog />;
  }

  return <PopPangRNRoot />;
}
