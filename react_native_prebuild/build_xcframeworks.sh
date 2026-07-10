#!/bin/bash

set -euo pipefail

export SRCROOT=$(pwd)
export WORKSPACE=ReactNativePrebuild
export PROJECT="Pods-$WORKSPACE"

function init_directory() {
  rm -rf "$SRCROOT/Frameworks"
  rm -rf "$SRCROOT/Sources"
  mkdir "$SRCROOT/Frameworks"
  mkdir "$SRCROOT/Sources"
  touch "$SRCROOT/Sources/dummy.swift"
}

function archive() {
  xcodebuild archive \
    -workspace "$WORKSPACE.xcworkspace" \
    -scheme "$PROJECT" \
    -archivePath "$SRCROOT/$PROJECT-iphonesimulator.xcarchive" \
    -configuration Release \
    -sdk iphonesimulator \
    -quiet \
    SKIP_INSTALL=NO

  xcodebuild archive \
    -workspace "$WORKSPACE.xcworkspace" \
    -scheme "$PROJECT" \
    -archivePath "$SRCROOT/$PROJECT-iphoneos.xcarchive" \
    -configuration Release \
    -sdk iphoneos \
    -quiet \
    SKIP_INSTALL=NO
}

function create_xcframework() {
  for framework in $(find "$SRCROOT/$PROJECT-iphonesimulator.xcarchive/Products/Library/Frameworks" -type d -name "*.framework"); do
    basename=$(basename "$framework")
    framework_name=$(basename "$framework" .framework)

    xcodebuild -create-xcframework \
      -framework "$SRCROOT/$PROJECT-iphonesimulator.xcarchive/Products/Library/Frameworks/$basename" \
      -framework "$SRCROOT/$PROJECT-iphoneos.xcarchive/Products/Library/Frameworks/$basename" \
      -output "$SRCROOT/Frameworks/$framework_name.xcframework"
  done

  cp -R "$SRCROOT/Pods/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework" \
  "$SRCROOT/Frameworks/hermesvm.xcframework"
}

function clean_temp() {
  rm -rf "$SRCROOT/$PROJECT-iphoneos.xcarchive"
  rm -rf "$SRCROOT/$PROJECT-iphonesimulator.xcarchive"
}

init_directory

npm install
pod install

archive
create_xcframework
clean_temp

ruby ./generate_package_swift.rb
