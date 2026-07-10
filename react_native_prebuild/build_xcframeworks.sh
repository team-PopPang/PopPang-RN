#!/usr/bin/env bash
set -euo pipefail

# React Core와 ReactNativeDependencies를 source-build 한다.
# Podfile에도 동일하게 0이 설정돼 있어야 한다.
export RCT_USE_PREBUILT_RNCORE="${RCT_USE_PREBUILT_RNCORE:-0}"
export RCT_USE_RN_DEP="${RCT_USE_RN_DEP:-0}"

# 스크립트를 실행한 현재 위치가 아니라,
# 스크립트 파일이 있는 react_native_prebuild 위치를 기준으로 동작한다.
readonly SRCROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

# 실제 RN 소스, package.json, package-lock.json, node_modules가 있는 루트다.
# 모든 JavaScript 및 네이티브 라이브러리 의존성은 이 루트에서만 관리한다.
readonly RN_PROJECT_ROOT="$(cd -- "$SRCROOT/.." && pwd)"

cd "$SRCROOT"

readonly WORKSPACE="ReactNativePrebuild"
readonly PROJECT="Pods-$WORKSPACE"
readonly CONFIGURATION="${1:-Release}"

# 최종 Swift Package 출력 디렉터리.
readonly FRAMEWORKS_DIR="$SRCROOT/Frameworks"
readonly SOURCES_DIR="$SRCROOT/Sources"

# Simulator / Device archive의 임시 출력 위치.
readonly SIM_ARCHIVE="$SRCROOT/$PROJECT-iphonesimulator.xcarchive"
readonly DEVICE_ARCHIVE="$SRCROOT/$PROJECT-iphoneos.xcarchive"

# archive 내부에서 framework들이 생성되는 위치.
readonly SIM_FRAMEWORKS_DIR="$SIM_ARCHIVE/Products/Library/Frameworks"
readonly DEVICE_FRAMEWORKS_DIR="$DEVICE_ARCHIVE/Products/Library/Frameworks"

# RN 0.86 iOS의 Hermes JavaScript VM 구현체.
# React Core는 source-build하지만 Hermes VM은 Pods가 제공하는 prebuilt XCFramework를 포함한다.
readonly HERMES_PREBUILT="$SRCROOT/Pods/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework"

ensure_root_node_modules() {
  # react_native_prebuild는 자체 package.json/node_modules를 사용하지 않는다.
  # 상위 PopPang-RN의 node_modules만 의존성 원본으로 사용한다.
  if [[ -d "$RN_PROJECT_ROOT/node_modules/react-native" ]]; then
    return 0
  fi

  echo "error: root node_modules/react-native not found" >&2
  echo "run: cd \"$RN_PROJECT_ROOT\" && npm ci" >&2
  return 1
}

archive() {
  # Simulator용 archive를 생성한다.
  xcodebuild archive \
    -workspace "$WORKSPACE.xcworkspace" \
    -scheme "$PROJECT" \
    -archivePath "$SIM_ARCHIVE" \
    -configuration "$CONFIGURATION" \
    -sdk iphonesimulator \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    CLANG_ENABLE_EXPLICIT_MODULES=NO \
    SWIFT_ENABLE_EXPLICIT_MODULES=NO

  # 실제 iPhone/iPad Device용 archive를 생성한다.
  xcodebuild archive \
    -workspace "$WORKSPACE.xcworkspace" \
    -scheme "$PROJECT" \
    -archivePath "$DEVICE_ARCHIVE" \
    -configuration "$CONFIGURATION" \
    -sdk iphoneos \
    SKIP_INSTALL=NO \
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES \
    CLANG_ENABLE_EXPLICIT_MODULES=NO \
    SWIFT_ENABLE_EXPLICIT_MODULES=NO
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

  # Simulator archive 안의 top-level framework들을 순회한다.
  # Device archive에 같은 이름의 framework가 있으면 두 결과를 묶어 XCFramework를 생성한다.
  while IFS= read -r -d '' framework; do
    basename="$(basename "$framework")"
    framework_name="${basename%.framework}"

    device_framework="$DEVICE_FRAMEWORKS_DIR/$basename"
    output="$FRAMEWORKS_DIR/$framework_name.xcframework"

    # Simulator에만 있고 Device에 없는 framework는 XCFramework로 만들 수 없다.
    if [[ ! -d "$device_framework" ]]; then
      echo "warning: device framework not found: $basename" >&2
      continue
    fi

    # 이전 빌드 결과가 남아 있으면 xcodebuild가 실패할 수 있으므로 제거한다.
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

  # Hermes VM은 Pods archive 결과에 포함되지 않으므로,
  # CocoaPods가 설치한 universal hermesvm.xcframework를 최종 패키지에 복사한다.
  rm -rf "$output"
  ditto "$HERMES_PREBUILT" "$output"
}

mark_framework_headers_as_system() {
  local module_map

  # 소비 앱이 RN 헤더 내부의 경고를 표시하지 않도록
  # 생성된 모든 framework module을 system module로 표시한다.
  while IFS= read -r -d '' module_map; do
    perl -0pi -e \
      's/^framework module ([^[:space:]]+) \{/framework module $1 [system] {/m' \
      "$module_map"
  done < <(
    find "$FRAMEWORKS_DIR" \
      -type f \
      -path "*/Modules/module.modulemap" \
      -print0
  )
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
  # Frameworks 디렉터리를 스캔해 Package.swift를 생성한다.
  # hermesvm.xcframework도 이 시점에는 이미 Frameworks에 존재해야 한다.
  if [[ -f "$SRCROOT/Gemfile" ]]; then
    bundle exec ruby "$SRCROOT/generate_package_swift.rb"
  else
    ruby "$SRCROOT/generate_package_swift.rb"
  fi
}

cleanup() {
  # 배포에 필요 없는 archive와 중간 build 결과만 정리한다.
  # Frameworks, Sources, Package.swift는 최종 SPM 패키지 결과물이므로 유지한다.
  rm -rf \
    "$SIM_ARCHIVE" \
    "$DEVICE_ARCHIVE" \
    "$SRCROOT/build"
}

build_and_create_frameworks() {
  # 이전 archive와 Xcode build 찌꺼기를 먼저 정리한다.
  rm -rf \
    "$SIM_ARCHIVE" \
    "$DEVICE_ARCHIVE" \
    "$SRCROOT/build"

  # 의존성 설치는 release-rn.sh가 루트에서 npm ci로 수행한다.
  # 여기서는 루트 node_modules가 준비됐는지만 확인한다.
  ensure_root_node_modules

  # 루트 package.json의 네이티브 RN 모듈까지 자동 연결해 Pods를 설치한다.
  run_pod_install

  # Simulator / Device archive를 각각 생성한다.
  archive

  # archive 안의 static framework들을 XCFramework로 만든다.
  create_xcframework

  # RN 0.86이 필요로 하는 Hermes VM prebuilt XCFramework를 추가한다.
  copy_hermes_xcframework

  # RN 헤더 내부 경고를 소비 앱에 노출하지 않는다.
  mark_framework_headers_as_system
}

initDirectory() {
  # 이전에 생성된 Swift Package 결과물을 제거한다.
  rm -rf "$FRAMEWORKS_DIR" "$SOURCES_DIR"
  rm -f "$SRCROOT/Package.swift"

  # 새로운 출력 디렉터리를 만든다.
  mkdir -p "$FRAMEWORKS_DIR" "$SOURCES_DIR"

  # Swift Package의 일반 target이 비어 있지 않도록 빈 Swift 파일을 생성한다.
  touch "$SOURCES_DIR/dummy.swift"
}

initDirectory
build_and_create_frameworks
run_package_generator
cleanup