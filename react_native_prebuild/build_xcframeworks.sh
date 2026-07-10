#!/usr/bin/env bash
set -euo pipefail

# 이 스크립트는 RN source-build 결과만 사용한다.
# Podfile/use_react_native! 쪽도 아래 두 값이 0이어야 한다.
export RCT_USE_PREBUILT_RNCORE="${RCT_USE_PREBUILT_RNCORE:-0}"
export RCT_USE_RN_DEP="${RCT_USE_RN_DEP:-0}"

# 스크립트를 실행한 현재 위치가 아니라,
# 스크립트 파일이 있는 위치를 기준으로 동작한다.
readonly SRCROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$SRCROOT"

readonly WORKSPACE="ReactNativePrebuild"
readonly PROJECT="Pods-$WORKSPACE"
readonly CONFIGURATION="${1:-Release}"

readonly FRAMEWORKS_DIR="$SRCROOT/Frameworks"
readonly SOURCES_DIR="$SRCROOT/Sources"

readonly SIM_ARCHIVE="$SRCROOT/$PROJECT-iphonesimulator.xcarchive"
readonly DEVICE_ARCHIVE="$SRCROOT/$PROJECT-iphoneos.xcarchive"

readonly SIM_FRAMEWORKS_DIR="$SIM_ARCHIVE/Products/Library/Frameworks"
readonly DEVICE_FRAMEWORKS_DIR="$DEVICE_ARCHIVE/Products/Library/Frameworks"

# RN 0.86 iOS에서 Hermes JavaScript VM 구현체로 사용하는 prebuilt XCFramework.
readonly HERMES_PREBUILT="$SRCROOT/Pods/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework"

archive() {
  # Simulator용 archive를 생성한다.
  xcodebuild archive \
    -workspace "$WORKSPACE.xcworkspace" \
    -scheme "$PROJECT" \
    -archivePath "$SIM_ARCHIVE" \
    -configuration "$CONFIGURATION" \
    -sdk iphonesimulator \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES

  # Device용 archive를 생성한다.
  xcodebuild archive \
    -workspace "$WORKSPACE.xcworkspace" \
    -scheme "$PROJECT" \
    -archivePath "$DEVICE_ARCHIVE" \
    -configuration "$CONFIGURATION" \
    -sdk iphoneos \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES
}

create_xcframework() {
  local framework
  local basename
  local framework_name
  local device_framework
  local output
  local created_count=0

  if [[ ! -d "$SIM_FRAMEWORKS_DIR" ]]; then
    echo "error: simulator frameworks directory not found" >&2
    echo "path: $SIM_FRAMEWORKS_DIR" >&2
    return 1
  fi

  if [[ ! -d "$DEVICE_FRAMEWORKS_DIR" ]]; then
    echo "error: device frameworks directory not found" >&2
    echo "path: $DEVICE_FRAMEWORKS_DIR" >&2
    return 1
  fi

  # simulator archive 안의 top-level framework들을 순회하면서
  # device archive의 같은 이름 framework와 짝지어 xcframework를 만든다.
  while IFS= read -r -d '' framework; do
    basename="$(basename "$framework")"
    framework_name="${basename%.framework}"

    device_framework="$DEVICE_FRAMEWORKS_DIR/$basename"
    output="$FRAMEWORKS_DIR/$framework_name.xcframework"

    # Simulator archive에는 존재하지만
    # Device archive에는 같은 framework가 없는 경우 건너뛴다.
    if [[ ! -d "$device_framework" ]]; then
      echo "warning: device framework not found: $basename" >&2
      continue
    fi

    # 이전 결과가 남아 있으면 xcodebuild가 실패할 수 있으므로 제거한다.
    rm -rf "$output"

    xcodebuild -create-xcframework \
      -framework "$framework" \
      -framework "$device_framework" \
      -output "$output"

    created_count=$((created_count + 1))
  done < <(
    find "$SIM_FRAMEWORKS_DIR" \
      -maxdepth 1 \
      -type d \
      -name "*.framework" \
      -print0
  )

  if [[ "$created_count" -eq 0 ]]; then
    echo "error: no frameworks were packaged into xcframeworks" >&2
    return 1
  fi
}

copy_hermes_xcframework() {
  local output="$FRAMEWORKS_DIR/hermesvm.xcframework"

  if [[ ! -d "$HERMES_PREBUILT" ]]; then
    echo "error: Hermes XCFramework not found" >&2
    echo "path: $HERMES_PREBUILT" >&2
    return 1
  fi

  # 이전 결과를 제거한 뒤 Pods가 제공하는 Hermes VM을 그대로 포함한다.
  rm -rf "$output"
  ditto "$HERMES_PREBUILT" "$output"
}

run_pod_install() {
  # Gemfile이 있으면 Bundler를 통해 pod install을 실행한다.
  if [[ -f "$SRCROOT/Gemfile" ]]; then
    bundle exec pod install
  else
    pod install
  fi
}

run_package_generator() {
  # generate_package_swift.rb도 Gemfile이 있으면
  # Bundler를 통해 실행한다.
  if [[ -f "$SRCROOT/Gemfile" ]]; then
    bundle exec ruby "$SRCROOT/generate_package_swift.rb"
  else
    ruby "$SRCROOT/generate_package_swift.rb"
  fi
}

cleanup() {
  # 임시 빌드 산출물만 정리한다.
  rm -rf \
    "$SIM_ARCHIVE" \
    "$DEVICE_ARCHIVE" \
    "$SRCROOT/build"

  # 매번 완전 초기화를 원하면 주석 해제.
  # rm -rf "$SRCROOT/Pods" "$SRCROOT/node_modules"
  # rm -f "$SRCROOT/Podfile.lock"
}

build_and_create_frameworks() {
  # 이전 빌드 찌꺼기를 먼저 정리한다.
  rm -rf \
    "$SIM_ARCHIVE" \
    "$DEVICE_ARCHIVE" \
    "$SRCROOT/build"

  # package-lock.json을 기준으로
  # node_modules를 깨끗하게 다시 설치한다.
  npm ci

  # React Native와 CocoaPods 의존성을 설치한다.
  run_pod_install

  # Simulator / Device archive를 각각 생성한다.
  archive

  # archive 안의 framework들을 xcframework로 만든다.
  create_xcframework

  # Hermes VM은 archive 결과에 없으므로 Pods의 prebuilt XCFramework를 포함한다.
  copy_hermes_xcframework
}

initDirectory() {
  # 이전에 생성된 결과물을 제거한다.
  rm -rf "$FRAMEWORKS_DIR" "$SOURCES_DIR"
  rm -f "$SRCROOT/Package.swift"

  # 새로운 출력 디렉터리를 만든다.
  mkdir -p "$FRAMEWORKS_DIR" "$SOURCES_DIR"

  # Swift Package의 일반 target이 비어 있지 않도록
  # 빈 Swift 파일을 생성한다.
  touch "$SOURCES_DIR/dummy.swift"
}

initDirectory
build_and_create_frameworks
run_package_generator
cleanup