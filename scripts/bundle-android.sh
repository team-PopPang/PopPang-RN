#!/bin/bash
set -e

rm -rf dist/android
mkdir -p dist/android

npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output dist/android/index.android.bundle \
  --assets-dest dist/android/assets
