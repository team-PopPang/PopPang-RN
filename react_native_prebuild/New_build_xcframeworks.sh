#!/usr/bin/env bash
set -euo pipefail

# 빠른 배포용 iOS prebuild 스크립트다.
#
# 기존 build_xcframeworks.sh는 source-build 경로를 보존한다. 이 스크립트는
# React Native 0.86의 prebuilt Core/Dependencies를 기본으로 사용하고, Pods와
# 최종 Swift Package가 같은 입력으로 이미 만들어졌다면 다시 빌드하지 않는다.
#
# 강제로 Pods를 다시 설치하거나 Swift Package를 다시 만들려면 다음처럼 실행한다.
#   FORCE_POD_INSTALL=1 ./New_build_xcframeworks.sh
#   FORCE_REBUILD=1 ./New_build_xcframeworks.sh
#
# Xcode target별 시간을 출력하려면 다음처럼 실행한다.
#   SHOW_BUILD_TIMING=1 ./New_build_xcframeworks.sh

readonly SRCROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly RN_PROJECT_ROOT="$(cd -- "$SRCROOT/.." && pwd)"

cd "$SRCROOT"

readonly WORKSPACE="ReactNativePrebuild"
readonly PROJECT="Pods-$WORKSPACE"
readonly CONFIGURATION="${1:-Release}"
# 배포 대상 앱과 framework device slice의 최소 iOS 버전을 통일한다.
# App Store Connect는 embedded framework의 Info.plist에도 이 값을 요구한다.
readonly IOS_DEPLOYMENT_TARGET="17.0"
readonly CACHE_DIR="$SRCROOT/.build/new-prebuild-cache"
readonly POD_STATE_DIR="$CACHE_DIR/pods"
readonly OUTPUT_STATE_DIR="$CACHE_DIR/outputs"

readonly FRAMEWORKS_DIR="$SRCROOT/Frameworks"
readonly HOST_SOURCES_DIR="$SRCROOT/HostSources"
readonly SOURCES_DIR="$SRCROOT/Sources"
readonly PACKAGE_SWIFT_PATH="$SRCROOT/Package.swift"

# prebuilt를 쓰지 못하는 환경은 기존 source-build 경로로 쉽게 되돌릴 수 있다.
export RCT_USE_PREBUILT_RNCORE="${RCT_USE_PREBUILT_RNCORE:-1}"
export RCT_USE_RN_DEP="${RCT_USE_RN_DEP:-1}"

readonly HERMES_PREBUILT="$SRCROOT/Pods/hermes-engine/destroot/Library/Frameworks/universal/hermesvm.xcframework"
readonly HERMES_HEADERS="$SRCROOT/Pods/hermes-engine/destroot/include/hermes"
readonly REACT_CORE_PREBUILT="$SRCROOT/Pods/React-Core-prebuilt/React.xcframework"
readonly REACT_NATIVE_DEPENDENCIES_PREBUILT="$SRCROOT/Pods/ReactNativeDependencies/framework/packages/react-native/ReactNativeDependencies.xcframework"
readonly MATERIALIZE_REACT_VFS_HEADERS="$SRCROOT/materialize_react_vfs_headers.rb"

if [[ ! "$CONFIGURATION" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "error: invalid build configuration: $CONFIGURATION" >&2
  exit 1
fi

# 루트 node_modules에 React Native가 설치됐는지 확인한다.
# CocoaPods와 코드 생성은 이 경로의 React Native 스크립트와 소스를 사용한다.
ensure_root_node_modules() {
  if [[ -d "$RN_PROJECT_ROOT/node_modules/react-native" ]]; then
    return 0
  fi

  echo "error: root node_modules/react-native not found" >&2
  echo "run: cd \"$RN_PROJECT_ROOT\" && npm ci" >&2
  return 1
}

# 파일 내용으로 캐시 fingerprint를 만든다.
# 파일이 없으면 "missing" 값을 포함해 파일 추가·삭제도 캐시 무효화 대상으로 처리한다.
hash_file_if_present() {
  local path="$1"

  if [[ -f "$path" ]]; then
    shasum -a 256 "$path"
  else
    printf 'missing %s\n' "$path"
  fi
}

# pod install 결과에 영향을 주는 입력을 해시한다.
# 반환값은 Pods 설치 상태 파일의 이름으로 사용한다.
pod_input_fingerprint() {
  {
    printf 'new-prebuild-pods-v1\n'
    printf 'configuration=%s\n' "$CONFIGURATION"
    printf 'RCT_USE_PREBUILT_RNCORE=%s\n' "$RCT_USE_PREBUILT_RNCORE"
    printf 'RCT_USE_RN_DEP=%s\n' "$RCT_USE_RN_DEP"
    hash_file_if_present "$SRCROOT/Podfile"
    hash_file_if_present "$SRCROOT/Gemfile"
    hash_file_if_present "$SRCROOT/Gemfile.lock"
    hash_file_if_present "$RN_PROJECT_ROOT/package.json"
    hash_file_if_present "$RN_PROJECT_ROOT/package-lock.json"
    hash_file_if_present "$RN_PROJECT_ROOT/react-native.config.js"
    hash_file_if_present "$RN_PROJECT_ROOT/node_modules/react-native/package.json"
  } | shasum -a 256 | awk '{print $1}'
}

# 최종 Swift Package 산출물에 영향을 주는 입력을 해시한다.
# 빌드 스크립트·헤더 변환기·패키지 생성기가 바뀌면 native archive를 다시 만든다.
output_fingerprint() {
  {
    printf 'new-prebuild-output-v1\n'
    printf 'configuration=%s\n' "$CONFIGURATION"
    printf 'RCT_USE_PREBUILT_RNCORE=%s\n' "$RCT_USE_PREBUILT_RNCORE"
    printf 'RCT_USE_RN_DEP=%s\n' "$RCT_USE_RN_DEP"
    xcodebuild -version
    hash_file_if_present "$SRCROOT/Podfile.lock"
    hash_file_if_present "$SRCROOT/New_build_xcframeworks.sh"
    hash_file_if_present "$SRCROOT/materialize_react_vfs_headers.rb"
    hash_file_if_present "$SRCROOT/generate_package_swift.rb"
    hash_file_if_present "$HOST_SOURCES_DIR/PopPangHostAction.m"
    hash_file_if_present "$HOST_SOURCES_DIR/include/PopPangHostAction.h"
  } | shasum -a 256 | awk '{print $1}'
}

# 기록한 fingerprint와 CocoaPods lock 파일을 함께 확인한다.
# 둘 다 일치할 때만 기존 Pods 설치 결과를 재사용한다.
pods_are_current() {
  local state_file="$1"

  [[ -f "$state_file" ]] &&
    [[ -f "$SRCROOT/Podfile.lock" ]] &&
    [[ -f "$SRCROOT/Pods/Manifest.lock" ]] &&
    cmp -s "$SRCROOT/Podfile.lock" "$SRCROOT/Pods/Manifest.lock"
}

# 캐시가 없거나 강제 설치를 요청한 경우에만 pod install을 실행한다.
# 설치 뒤 Manifest.lock까지 검증해 불완전한 Pods 상태를 다음 단계로 넘기지 않는다.
run_pod_install_if_needed() {
  local pod_fingerprint="$1"
  local state_file="$POD_STATE_DIR/$pod_fingerprint.done"

  if [[ "${FORCE_POD_INSTALL:-0}" != "1" ]] && pods_are_current "$state_file"; then
    echo "Pods are current. Skipping pod install."
    return 0
  fi

  echo "Installing Pods for prebuilt React Native Core."
  if [[ -f "$SRCROOT/Gemfile" ]]; then
    bundle exec pod install
  else
    pod install
  fi

  if ! cmp -s "$SRCROOT/Podfile.lock" "$SRCROOT/Pods/Manifest.lock"; then
    echo "error: CocoaPods Manifest.lock does not match Podfile.lock" >&2
    return 1
  fi

  mkdir -p "$POD_STATE_DIR"
  printf '%s\n' "$pod_fingerprint" > "$state_file"
}

# prebuilt React Native를 요청했는데 관련 Pod가 없으면 source-build 전환 가능성을 알린다.
# 경고만 출력하고, 실제 누락 여부는 이후 복사 단계에서 오류로 처리한다.
warn_if_prebuilt_fallback() {
  if [[ "$RCT_USE_PREBUILT_RNCORE" == "1" && ! -d "$SRCROOT/Pods/React-Core-prebuilt" ]]; then
    echo "warning: React-Core-prebuilt was not installed. React Native may have fallen back to source-build." >&2
  fi

  if [[ "$RCT_USE_RN_DEP" == "1" && ! -d "$SRCROOT/Pods/ReactNativeDependencies" ]]; then
    echo "warning: ReactNativeDependencies was not installed. React Native may have fallen back to source-build." >&2
  fi
}

# fingerprint와 배포 산출물의 완전성을 확인해 native archive 재실행 여부를 결정한다.
# React VFS 헤더와 서명 제거 상태까지 검사해 깨진 캐시를 재사용하지 않는다.
output_is_current() {
  local fingerprint="$1"
  local state_file="$OUTPUT_STATE_DIR/$CONFIGURATION.done"

  [[ "${FORCE_REBUILD:-0}" != "1" ]] &&
    [[ -f "$state_file" ]] &&
    [[ "$(<"$state_file")" == "$fingerprint" ]] &&
    [[ -d "$FRAMEWORKS_DIR" ]] &&
    [[ -d "$HOST_SOURCES_DIR" ]] &&
    [[ -d "$SOURCES_DIR" ]] &&
    [[ -f "$PACKAGE_SWIFT_PATH" ]] &&
    prebuilt_frameworks_are_packaged "$FRAMEWORKS_DIR" "$PACKAGE_SWIFT_PATH" &&
    device_framework_minimum_os_versions_are_valid "$FRAMEWORKS_DIR" >/dev/null 2>&1 &&
    find "$FRAMEWORKS_DIR" -maxdepth 1 -type d -name '*.xcframework' -print -quit | grep -q .
}

# prebuilt React/RNDependencies가 XCFramework와 SwiftPM binary target으로 함께 포함됐는지 확인한다.
# SwiftPM에서 시스템 프레임워크처럼 잘못 링크하거나 기존 코드 서명을 남긴 경우도 실패로 처리한다.
prebuilt_frameworks_are_packaged() {
  local frameworks_dir="$1"
  local package_swift_path="$2"
  local framework_name

  for framework_name in React ReactNativeDependencies; do
    if [[ "$framework_name" == "React" && "$RCT_USE_PREBUILT_RNCORE" != "1" ]]; then
      continue
    fi

    if [[ "$framework_name" == "ReactNativeDependencies" && "$RCT_USE_RN_DEP" != "1" ]]; then
      continue
    fi

    [[ -d "$frameworks_dir/$framework_name.xcframework" ]] || return 1
    grep -Fq "name: \"$framework_name\"" "$package_swift_path" || return 1
    ! grep -Fq ".linkedFramework(\"$framework_name\"" "$package_swift_path" || return 1
    ! find "$frameworks_dir/$framework_name.xcframework" \
      -type d \
      -name _CodeSignature \
      -print -quit | grep -q . || return 1
  done

  prebuilt_react_headers_are_materialized "$frameworks_dir"
}

# 모든 React framework slice에 SwiftPM용 물리 헤더가 배치됐는지 확인한다.
# VFS, React Native dependency, Hermes 헤더 중 하나라도 없으면 캐시를 무효화한다.
prebuilt_react_headers_are_materialized() {
  local frameworks_dir="$1"
  local react_xcframework="$frameworks_dir/React.xcframework"
  local headers_dir
  local found_slice=0

  [[ "$RCT_USE_PREBUILT_RNCORE" == "1" ]] || return 0
  [[ -f "$react_xcframework/React-VFS-template.yaml" ]] || return 1

  while IFS= read -r -d '' headers_dir; do
    found_slice=1
    [[ -f "$headers_dir/RCTDefines.h" ]] || return 1
    [[ -f "$headers_dir/ReactCommon/CallInvoker.h" ]] || return 1
    [[ -f "$headers_dir/React_RCTAppDelegate/RCTDependencyProvider.h" ]] || return 1
    [[ -f "$headers_dir/folly/dynamic.h" ]] || return 1
    [[ -f "$headers_dir/hermes/hermes.h" ]] || return 1
  done < <(
    find "$react_xcframework" \
      -type d \
      -path '*/React.framework/Headers' \
      -print0
  )

  [[ "$found_slice" == "1" ]]
}

# XCFramework 안에서 iOS device slice의 framework Info.plist만 순회한다.
# Simulator와 Mac Catalyst slice는 App Store에 embedded framework로 포함되지 않으므로 제외한다.
for_each_device_framework_info_plist() {
  local frameworks_dir="$1"
  local callback="$2"
  local xcframework_path
  local plist_path

  for xcframework_path in "$frameworks_dir"/*.xcframework; do
    [[ -d "$xcframework_path" ]] || continue

    while IFS= read -r -d '' plist_path; do
      case "$plist_path" in
        *-simulator/* | *-maccatalyst/*)
          continue
          ;;
      esac

      "$callback" "$plist_path"
    done < <(
      find "$xcframework_path" \
        -type f \
        -path '*/ios-*/*.framework/Info.plist' \
        -print0
    )
  done
}

# Info.plist의 MinimumOSVersion을 배포 대상과 같은 문자열 값으로 다시 기록한다.
# prebuilt framework와 CocoaPods archive 결과 모두 같은 규칙으로 처리한다.
set_device_framework_minimum_os_version() {
  local plist_path="$1"

  /usr/libexec/PlistBuddy -c 'Delete :MinimumOSVersion' "$plist_path" >/dev/null 2>&1 || true
  /usr/libexec/PlistBuddy \
    -c "Add :MinimumOSVersion string $IOS_DEPLOYMENT_TARGET" \
    "$plist_path"
}

# 모든 iOS device framework slice가 예상한 값을 가지는지 검사한다.
# 누락·다른 버전을 발견하면 staging 결과를 publish하지 않는다.
verify_device_framework_minimum_os_version() {
  local plist_path="$1"
  local actual_version

  actual_version="$(/usr/libexec/PlistBuddy -c 'Print :MinimumOSVersion' "$plist_path" 2>/dev/null || true)"
  if [[ "$actual_version" != "$IOS_DEPLOYMENT_TARGET" ]]; then
    echo "error: invalid MinimumOSVersion in $plist_path: ${actual_version:-missing}" >&2
    return 1
  fi
}

device_framework_minimum_os_versions_are_valid() {
  local frameworks_dir="$1"
  local plist_path
  local found_count=0

  for xcframework_path in "$frameworks_dir"/*.xcframework; do
    [[ -d "$xcframework_path" ]] || continue

    while IFS= read -r -d '' plist_path; do
      case "$plist_path" in
        *-simulator/* | *-maccatalyst/*)
          continue
          ;;
      esac

      found_count=$((found_count + 1))
      verify_device_framework_minimum_os_version "$plist_path" || return 1
    done < <(
      find "$xcframework_path" \
        -type f \
        -path '*/ios-*/*.framework/Info.plist' \
        -print0
    )
  done

  if [[ "$found_count" -eq 0 ]]; then
    echo "error: no iOS device framework Info.plist was found" >&2
    return 1
  fi
}

# 배포 직전에 모든 iOS device slice의 Info.plist를 정규화한다.
# 이후 서명 제거 단계에서 수정으로 무효화된 기존 framework 서명을 함께 제거한다.
normalize_device_framework_minimum_os_versions() {
  for_each_device_framework_info_plist \
    "$STAGING_FRAMEWORKS_DIR" \
    set_device_framework_minimum_os_version

  device_framework_minimum_os_versions_are_valid "$STAGING_FRAMEWORKS_DIR"
}

mkdir -p "$SRCROOT/.build"
readonly STAGING_ROOT="$(mktemp -d "$SRCROOT/.build/new-prebuild.XXXXXX")"
readonly STAGING_FRAMEWORKS_DIR="$STAGING_ROOT/Frameworks"
readonly STAGING_HOST_SOURCES_DIR="$STAGING_ROOT/HostSources"
readonly STAGING_SOURCES_DIR="$STAGING_ROOT/Sources"
readonly STAGING_PACKAGE_SWIFT_PATH="$STAGING_ROOT/Package.swift"
readonly SIM_ARCHIVE="$STAGING_ROOT/$PROJECT-iphonesimulator.xcarchive"
readonly DEVICE_ARCHIVE="$STAGING_ROOT/$PROJECT-iphoneos.xcarchive"
readonly SIM_FRAMEWORKS_DIR="$SIM_ARCHIVE/Products/Library/Frameworks"
readonly DEVICE_FRAMEWORKS_DIR="$DEVICE_ARCHIVE/Products/Library/Frameworks"

PUBLISHED=0
PUBLISH_BACKUP_DIR=""

# publish 중간에 실패했을 때 기존 Frameworks, HostSources, Sources, Package.swift를 복원한다.
# staging 결과가 불완전해도 마지막 정상 산출물은 유지한다.
rollback_publish() {
  local entry

  [[ -n "$PUBLISH_BACKUP_DIR" ]] || return 0

  rm -rf "$FRAMEWORKS_DIR" "$HOST_SOURCES_DIR" "$SOURCES_DIR" "$PACKAGE_SWIFT_PATH"
  for entry in Frameworks HostSources Sources Package.swift; do
    if [[ -e "$PUBLISH_BACKUP_DIR/$entry" ]]; then
      mv "$PUBLISH_BACKUP_DIR/$entry" "$SRCROOT/$entry"
    fi
  done
}

# EXIT trap에서 staging 디렉터리와 publish 백업을 정리한다.
# publish가 완료되지 않았으면 먼저 이전 산출물을 복원한다.
cleanup() {
  local status="$?"

  if [[ "$PUBLISHED" != "1" ]]; then
    rollback_publish || true
  fi

  rm -rf "$STAGING_ROOT"
  if [[ -n "$PUBLISH_BACKUP_DIR" ]]; then
    rm -rf "$PUBLISH_BACKUP_DIR"
  fi
  exit "$status"
}
trap cleanup EXIT

# 지정한 SDK용 Pods framework archive를 만든다.
# 필요하면 환경 변수로 Xcode target별 빌드 시간을 함께 출력한다.
archive_for_sdk() {
  local sdk="$1"
  local archive_path="$2"
  local derived_data_path="$3"
  local -a xcodebuild_arguments=(
    archive
    -workspace "$WORKSPACE.xcworkspace"
    -scheme "$PROJECT"
    -archivePath "$archive_path"
    -derivedDataPath "$derived_data_path"
    -configuration "$CONFIGURATION"
    -sdk "$sdk"
    SKIP_INSTALL=NO
    BUILD_LIBRARY_FOR_DISTRIBUTION=YES
    IPHONEOS_DEPLOYMENT_TARGET="$IOS_DEPLOYMENT_TARGET"
    CLANG_ENABLE_EXPLICIT_MODULES=NO
    SWIFT_ENABLE_EXPLICIT_MODULES=NO
  )

  # macOS 기본 Bash 3.2에서는 set -u 상태의 빈 배열을 확장하면 오류가 난다.
  # 옵션이 필요할 때만 명시적으로 붙인다.
  if [[ "${SHOW_BUILD_TIMING:-0}" == "1" ]]; then
    xcodebuild "${xcodebuild_arguments[@]}" -showBuildTimingSummary
  else
    xcodebuild "${xcodebuild_arguments[@]}"
  fi
}

# Simulator와 Device archive를 같은 DerivedData 캐시 아래에 만든다.
# 두 archive는 다음 XCFramework 생성 단계의 입력이다.
archive_frameworks() {
  local output_fingerprint="$1"
  local derived_data_path="$CACHE_DIR/DerivedData/$output_fingerprint"

  mkdir -p "$derived_data_path"
  archive_for_sdk iphonesimulator "$SIM_ARCHIVE" "$derived_data_path"
  archive_for_sdk iphoneos "$DEVICE_ARCHIVE" "$derived_data_path"
}

# Simulator/Device archive에 공통으로 있는 framework를 XCFramework로 묶는다.
# 한 플랫폼에만 있는 framework는 경고 후 제외한다.
create_xcframeworks() {
  local framework
  local basename
  local device_framework
  local output
  local created_count=0

  if [[ ! -d "$SIM_FRAMEWORKS_DIR" || ! -d "$DEVICE_FRAMEWORKS_DIR" ]]; then
    echo "error: archive frameworks directory not found" >&2
    return 1
  fi

  while IFS= read -r -d '' framework; do
    basename="$(basename "$framework")"
    device_framework="$DEVICE_FRAMEWORKS_DIR/$basename"
    output="$STAGING_FRAMEWORKS_DIR/${basename%.framework}.xcframework"

    if [[ ! -d "$device_framework" ]]; then
      echo "warning: device framework not found: $basename" >&2
      continue
    fi

    xcodebuild -create-xcframework \
      -framework "$framework" \
      -framework "$device_framework" \
      -output "$output"
    created_count=$((created_count + 1))
  done < <(
    find "$SIM_FRAMEWORKS_DIR" \
      -maxdepth 1 \
      -type d \
      -name '*.framework' \
      -print0
  )

  if [[ "$created_count" -eq 0 ]]; then
    echo "error: no frameworks were packaged into xcframeworks" >&2
    return 1
  fi
}

# Hermes prebuilt XCFramework를 staging 패키지에 복사한다.
# Hermes는 Pods archive 결과가 아니라 React Native가 제공하는 prebuilt를 사용한다.
copy_hermes_xcframework() {
  if [[ ! -d "$HERMES_PREBUILT" ]]; then
    echo "error: Hermes XCFramework not found" >&2
    echo "path: $HERMES_PREBUILT" >&2
    return 1
  fi

  ditto "$HERMES_PREBUILT" "$STAGING_FRAMEWORKS_DIR/hermesvm.xcframework"
}

# React Core와 React Native Dependencies prebuilt를 staging 패키지에 복사한다.
# 환경 변수로 prebuilt 사용을 끈 경우에는 해당 framework를 복사하지 않는다.
copy_prebuilt_react_native_xcframeworks() {
  local source_path
  local framework_name

  if [[ "$RCT_USE_PREBUILT_RNCORE" == "1" ]]; then
    source_path="$REACT_CORE_PREBUILT"
    framework_name="React"

    [[ -d "$source_path" ]] || {
      echo "error: prebuilt React XCFramework not found" >&2
      echo "path: $source_path" >&2
      return 1
    }

    ditto "$source_path" "$STAGING_FRAMEWORKS_DIR/$framework_name.xcframework"
  fi

  if [[ "$RCT_USE_RN_DEP" == "1" ]]; then
    source_path="$REACT_NATIVE_DEPENDENCIES_PREBUILT"
    framework_name="ReactNativeDependencies"

    [[ -d "$source_path" ]] || {
      echo "error: prebuilt React Native dependencies XCFramework not found" >&2
      echo "path: $source_path" >&2
      return 1
    }

    ditto "$source_path" "$STAGING_FRAMEWORKS_DIR/$framework_name.xcframework"
  fi
}

# CocoaPods 전용 VFS 헤더 구성을 SwiftPM에서 읽을 수 있는 실제 파일 구조로 변환한다.
# prebuilt React와 RNDependencies를 모두 사용하는 경우에만 변환기를 실행한다.
materialize_prebuilt_react_headers() {
  [[ "$RCT_USE_PREBUILT_RNCORE" == "1" ]] || return 0

  if [[ "$RCT_USE_RN_DEP" != "1" ]]; then
    echo "error: SwiftPM prebuilt React requires RCT_USE_RN_DEP=1" >&2
    echo "React Native dependency headers are required to materialize the package." >&2
    return 1
  fi

  [[ -f "$MATERIALIZE_REACT_VFS_HEADERS" ]] || {
    echo "error: React VFS materializer not found" >&2
    echo "path: $MATERIALIZE_REACT_VFS_HEADERS" >&2
    return 1
  }

  if [[ -f "$SRCROOT/Gemfile" ]]; then
    bundle exec ruby "$MATERIALIZE_REACT_VFS_HEADERS" \
      "$STAGING_FRAMEWORKS_DIR/React.xcframework" \
      "$STAGING_FRAMEWORKS_DIR/ReactNativeDependencies.xcframework" \
      "$HERMES_HEADERS" \
      "$STAGING_FRAMEWORKS_DIR" \
      "$IOS_DEPLOYMENT_TARGET"
  else
    ruby "$MATERIALIZE_REACT_VFS_HEADERS" \
      "$STAGING_FRAMEWORKS_DIR/React.xcframework" \
      "$STAGING_FRAMEWORKS_DIR/ReactNativeDependencies.xcframework" \
      "$HERMES_HEADERS" \
      "$STAGING_FRAMEWORKS_DIR" \
      "$IOS_DEPLOYMENT_TARGET"
  fi
}

# 헤더와 module map을 수정한 뒤 무효가 된 XCFramework 코드 서명을 제거한다.
# 최종 서명은 소비 앱을 빌드할 때 Xcode가 수행한다.
strip_packaged_xcframework_signatures() {
  local xcframework_path
  local signature_dir

  # 헤더 경로를 정규화한 모든 XCFramework는 기존 서명이 무효가 된다.
  # Mac Catalyst slice는 재서명할 수 없으므로 배포 중간 산출물의 서명을 제거하고
  # 소비 앱의 build 단계에서 최종 코드 서명을 맡긴다.
  while IFS= read -r -d '' signature_dir; do
    rm -rf "$signature_dir"
  done < <(
    find "$STAGING_FRAMEWORKS_DIR" -type d -name _CodeSignature -print0
  )
}

# iOS 호스트 앱이 RN 완료 이벤트를 Swift 액션으로 연결할 수 있도록 브리지 소스를 staging에 넣는다.
copy_host_sources() {
  [[ -d "$HOST_SOURCES_DIR" ]] || {
    echo "error: PopPang iOS host bridge sources not found" >&2
    echo "path: $HOST_SOURCES_DIR" >&2
    return 1
  }

  ditto "$HOST_SOURCES_DIR" "$STAGING_HOST_SOURCES_DIR"
}

# staging Frameworks 목록을 바탕으로 SwiftPM Package.swift를 생성한다.
# 생성기는 CocoaPods linker flag도 SwiftPM linkerSettings로 옮긴다.
generate_package_swift() {
  if [[ -f "$SRCROOT/Gemfile" ]]; then
    POPPANG_FRAMEWORKS_DIR="$STAGING_FRAMEWORKS_DIR" \
      POPPANG_PACKAGE_SWIFT_PATH="$STAGING_PACKAGE_SWIFT_PATH" \
      bundle exec ruby "$SRCROOT/generate_package_swift.rb"
  else
    POPPANG_FRAMEWORKS_DIR="$STAGING_FRAMEWORKS_DIR" \
      POPPANG_PACKAGE_SWIFT_PATH="$STAGING_PACKAGE_SWIFT_PATH" \
      ruby "$SRCROOT/generate_package_swift.rb"
  fi
}

# publish 전에 Package.swift와 XCFramework 결과물이 완전한지 검사한다.
# React prebuilt와 물리 헤더가 빠진 산출물은 배포하지 않는다.
verify_staged_package() {
  [[ -f "$STAGING_PACKAGE_SWIFT_PATH" ]] || {
    echo "error: Package.swift was not generated" >&2
    return 1
  }

  [[ -f "$STAGING_HOST_SOURCES_DIR/PopPangHostAction.m" ]] || {
    echo "error: PopPang iOS host bridge source was not staged" >&2
    return 1
  }

  find "$STAGING_FRAMEWORKS_DIR" -maxdepth 1 -type d -name '*.xcframework' -print -quit | grep -q . || {
    echo "error: no XCFramework was generated" >&2
    return 1
  }

  prebuilt_frameworks_are_packaged \
    "$STAGING_FRAMEWORKS_DIR" \
    "$STAGING_PACKAGE_SWIFT_PATH" || {
      echo "error: prebuilt React Native XCFrameworks were not packaged correctly" >&2
    return 1
  }

  device_framework_minimum_os_versions_are_valid "$STAGING_FRAMEWORKS_DIR"
}

# 검증을 통과한 staging 결과물을 최종 배포 디렉터리로 원자적으로 교체한다.
# 기존 결과물은 cleanup에서 복원할 수 있도록 임시 백업으로 옮긴다.
publish_staged_package() {
  local entry

  PUBLISH_BACKUP_DIR="$(mktemp -d "$CACHE_DIR/publish-backup.XXXXXX")"
  for entry in Frameworks HostSources Sources Package.swift; do
    if [[ -e "$SRCROOT/$entry" ]]; then
      mv "$SRCROOT/$entry" "$PUBLISH_BACKUP_DIR/$entry"
    fi
  done

  mv "$STAGING_FRAMEWORKS_DIR" "$FRAMEWORKS_DIR"
  mv "$STAGING_HOST_SOURCES_DIR" "$HOST_SOURCES_DIR"
  mv "$STAGING_SOURCES_DIR" "$SOURCES_DIR"
  mv "$STAGING_PACKAGE_SWIFT_PATH" "$PACKAGE_SWIFT_PATH"
  PUBLISHED=1
}

# 전체 iOS prebuild 흐름을 실행한다.
# 입력이 같으면 캐시를 반환하고, 달라졌다면 staging부터 검증·publish까지 수행한다.
main() {
  local pod_fingerprint
  local package_fingerprint

  ensure_root_node_modules
  mkdir -p "$CACHE_DIR" "$POD_STATE_DIR" "$OUTPUT_STATE_DIR"

  pod_fingerprint="$(pod_input_fingerprint)"
  run_pod_install_if_needed "$pod_fingerprint"
  warn_if_prebuilt_fallback

  package_fingerprint="$(output_fingerprint)"
  if output_is_current "$package_fingerprint"; then
    echo "Swift Package is current. Skipping native archive build."
    return 0
  fi

  mkdir -p "$STAGING_FRAMEWORKS_DIR" "$STAGING_SOURCES_DIR"
  touch "$STAGING_SOURCES_DIR/dummy.swift"

  archive_frameworks "$package_fingerprint"
  create_xcframeworks
  copy_hermes_xcframework
  copy_prebuilt_react_native_xcframeworks
  materialize_prebuilt_react_headers
  normalize_device_framework_minimum_os_versions
  strip_packaged_xcframework_signatures
  copy_host_sources
  generate_package_swift
  verify_staged_package
  publish_staged_package

  printf '%s\n' "$package_fingerprint" > "$OUTPUT_STATE_DIR/$CONFIGURATION.done"
  echo "Prebuilt React Native Swift Package generated successfully."
}

main "$@"
