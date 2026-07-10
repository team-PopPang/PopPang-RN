#!/bin/bash
set -e

rm -rf dist/ios
mkdir -p dist/ios

npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file native-entry.js \
  --bundle-output dist/ios/main.jsbundle \
  --assets-dest dist/ios/assets