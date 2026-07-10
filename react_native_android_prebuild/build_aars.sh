#!/usr/bin/env bash
set -euo pipefail

readonly SRCROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly RN_PROJECT_ROOT="$(cd -- "$SRCROOT/.." && pwd)"
readonly GRADLEW="$RN_PROJECT_ROOT/android/gradlew"
readonly ANDROID_PROJECT_DIR="$RN_PROJECT_ROOT/android"

readonly INPUT_VERSION="${1:-$(node -p "require('$RN_PROJECT_ROOT/package.json').version")}"
readonly MAVEN_VERSION="${INPUT_VERSION#v}"
readonly RELEASE_TAG="v$MAVEN_VERSION"

readonly OUTPUT_DIR="$SRCROOT/output"
readonly REPOSITORY_DIR="$OUTPUT_DIR/repository"
readonly COORDINATES_FILE="$SRCROOT/build/prebuild/external-dependencies.txt"
readonly ZIP_FILE="$OUTPUT_DIR/poppang-rn-android-maven-$RELEASE_TAG.zip"
readonly LINKED_NATIVE_LIBS_ROOT="$ANDROID_PROJECT_DIR/app/build/intermediates/merged_native_libs"
readonly SDK_JNI_LIBS_ROOT="$SRCROOT/poppang-rn-sdk/build/generated/jniLibs"

configure_java_home() {
  local java_home_17="${JAVA_HOME_17:-}"
  local homebrew_java_home=""

  if [[ -z "$java_home_17" ]] && java -version 2>&1 | grep -q 'version "17\.'; then
    return 0
  fi

  if [[ -z "$java_home_17" && -x /usr/libexec/java_home ]]; then
    java_home_17="$(/usr/libexec/java_home -v 17 2>/dev/null || true)"
  fi

  if [[ -z "$java_home_17" ]] && command -v brew >/dev/null 2>&1; then
    homebrew_java_home="$(brew --prefix openjdk@17 2>/dev/null || true)"
    if [[ -x "$homebrew_java_home/bin/java" ]]; then
      java_home_17="$homebrew_java_home"
    fi
  fi

  if [[ -z "$java_home_17" && -x /opt/homebrew/opt/openjdk@17/bin/java ]]; then
    java_home_17="/opt/homebrew/opt/openjdk@17"
  fi

  if [[ -z "$java_home_17" && -x /usr/local/opt/openjdk@17/bin/java ]]; then
    java_home_17="/usr/local/opt/openjdk@17"
  fi

  if [[ -z "$java_home_17" ]]; then
    echo "error: JDK 17 is required for Android native prebuild" >&2
    echo "set JAVA_HOME_17 to a JDK 17 installation" >&2
    return 1
  fi

  export JAVA_HOME="$java_home_17"
  export PATH="$JAVA_HOME/bin:$PATH"
}

ensure_environment() {
  if [[ ! "$MAVEN_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+([.-][0-9A-Za-z.-]+)?$ ]]; then
    echo "error: invalid version: $INPUT_VERSION" >&2
    return 1
  fi

  if [[ ! -x "$GRADLEW" ]]; then
    echo "error: Gradle wrapper not found: $GRADLEW" >&2
    return 1
  fi

  if [[ ! -d "$RN_PROJECT_ROOT/node_modules/react-native" ]]; then
    echo "error: root node_modules/react-native not found" >&2
    echo "run: cd \"$RN_PROJECT_ROOT\" && npm ci" >&2
    return 1
  fi
}

prepare_native_linkage() {
  local native_library
  local abi
  local variant
  local merge_task_name
  local linked_native_libs_dir
  local sdk_jni_libs_dir
  local copied_count

  # RN 0.86의 core TurboModule provider와 npm Fabric/Codegen 모듈을 연결한다.
  # RN C++ ABI가 build type별로 다르므로 debug/release 링크 결과를 각각 추출한다.
  "$GRADLEW" \
    -p "$ANDROID_PROJECT_DIR" \
    :app:mergeDebugNativeLibs \
    :app:mergeReleaseNativeLibs

  rm -rf "$SDK_JNI_LIBS_ROOT"

  for variant in debug release; do
    if [[ "$variant" == "debug" ]]; then
      merge_task_name="mergeDebugNativeLibs"
    else
      merge_task_name="mergeReleaseNativeLibs"
    fi

    linked_native_libs_dir="$LINKED_NATIVE_LIBS_ROOT/$variant/$merge_task_name/out/lib"
    sdk_jni_libs_dir="$SDK_JNI_LIBS_ROOT/$variant"
    copied_count=0

    while IFS= read -r -d '' native_library; do
      abi="$(basename "$(dirname "$native_library")")"
      mkdir -p "$sdk_jni_libs_dir/$abi"
      cp "$native_library" "$sdk_jni_libs_dir/$abi/"
      copied_count=$((copied_count + 1))
    done < <(
      find "$linked_native_libs_dir" \
        -type f \
        \( -name 'libappmodules.so' -o -name 'libreact_codegen_*.so' \) \
        -print0
    )

    if [[ "$copied_count" -eq 0 ]]; then
      echo "error: no New Architecture native linkage outputs found for $variant" >&2
      echo "path: $linked_native_libs_dir" >&2
      return 1
    fi

    for abi in armeabi-v7a arm64-v8a x86 x86_64; do
      if [[ ! -f "$sdk_jni_libs_dir/$abi/libappmodules.so" ]]; then
        echo "error: $variant libappmodules.so not found for $abi" >&2
        return 1
      fi
    done
  done
}

build_and_publish() {
  rm -rf "$OUTPUT_DIR"

  "$GRADLEW" \
    -p "$SRCROOT" \
    -PpoppangVersion="$MAVEN_VERSION" \
    -PpoppangTag="$RELEASE_TAG" \
    publishPrebuiltRepository \
    writeExternalDependencyCoordinates
}

mirror_external_dependencies() {
  node \
    "$SRCROOT/scripts/mirror-gradle-cache.mjs" \
    "$COORDINATES_FILE" \
    "$REPOSITORY_DIR"
}

package_repository() {
  "$GRADLEW" \
    -p "$SRCROOT" \
    -PpoppangVersion="$MAVEN_VERSION" \
    -PpoppangTag="$RELEASE_TAG" \
    packageRepository
}

validate_outputs() {
  local sdk_dir="$REPOSITORY_DIR/com/poppang/poppang-rn-android/$MAVEN_VERSION"
  local sdk_debug_aar="$sdk_dir/poppang-rn-android-$MAVEN_VERSION-debug.aar"
  local sdk_release_aar="$sdk_dir/poppang-rn-android-$MAVEN_VERSION-release.aar"
  local sdk_module="$sdk_dir/poppang-rn-android-$MAVEN_VERSION.module"
  local sdk_pom="$sdk_dir/poppang-rn-android-$MAVEN_VERSION.pom"
  local classes_jar="$SRCROOT/build/prebuild/poppang-rn-sdk-classes.jar"

  [[ -f "$sdk_debug_aar" ]] || {
    echo "error: debug SDK AAR not found: $sdk_debug_aar" >&2
    return 1
  }
  [[ -f "$sdk_release_aar" ]] || {
    echo "error: release SDK AAR not found: $sdk_release_aar" >&2
    return 1
  }
  [[ -f "$sdk_module" ]] || {
    echo "error: SDK Gradle module metadata not found: $sdk_module" >&2
    return 1
  }
  [[ -f "$sdk_pom" ]] || {
    echo "error: SDK POM not found: $sdk_pom" >&2
    return 1
  }
  [[ -f "$ZIP_FILE" ]] || {
    echo "error: repository zip not found: $ZIP_FILE" >&2
    return 1
  }

  mkdir -p "$(dirname "$classes_jar")"
  unzip -p "$sdk_release_aar" classes.jar > "$classes_jar"

  jar tf "$classes_jar" | grep -F 'com/poppang/rn/PopPangRnActivity.class' >/dev/null
  jar tf "$classes_jar" | grep -F 'com/poppang/rn/PopPangReactRuntime.class' >/dev/null
  jar tf "$classes_jar" | grep -F 'com/poppang/rn/PopPangPackageList.class' >/dev/null

  unzip -l "$sdk_debug_aar" | grep -F 'jni/arm64-v8a/libappmodules.so' >/dev/null
  unzip -l "$sdk_release_aar" | grep -F 'jni/arm64-v8a/libappmodules.so' >/dev/null
  unzip -l "$sdk_release_aar" | grep -F 'jni/arm64-v8a/libreact_codegen_safeareacontext.so' >/dev/null

  grep -q 'debugVariant' "$sdk_module"
  grep -q 'releaseVariant' "$sdk_module"
  grep -q 'react-native-safe-area-context' "$sdk_pom"
  grep -q 'react-android' "$sdk_pom"
  grep -q 'hermes-android' "$sdk_pom"

  echo "Android prebuild completed"
  echo "Maven repository: $REPOSITORY_DIR"
  echo "Distribution zip: $ZIP_FILE"
}

configure_java_home
ensure_environment
prepare_native_linkage
build_and_publish
mirror_external_dependencies
package_repository
validate_outputs
