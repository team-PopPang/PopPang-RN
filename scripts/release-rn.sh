# #!/bin/bash
# set -euo pipefail

# VERSION="${1:-}"

# if [[ -z "$VERSION" ]]; then
#   echo "사용법: ./scripts/release-rn.sh v0.1.0"
#   exit 1
# fi

# ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
# RELEASE_DIR="$ROOT_DIR/release"
# STAGING_DIR="$RELEASE_DIR/staging"

# SPM_DIR_NAME="PrebuiltReactNativeFrameworks"
# SPM_SRC_DIR="$ROOT_DIR/react_native_prebuild"

# IOS_BUNDLE_NAME="poppang-rn-ios-bundle-$VERSION"
# ANDROID_BUNDLE_NAME="poppang-rn-android-bundle-$VERSION"
# SPM_ZIP_NAME="poppang-rn-spm-$VERSION.zip"
# IOS_ZIP_NAME="$IOS_BUNDLE_NAME.zip"
# ANDROID_ZIP_NAME="$ANDROID_BUNDLE_NAME.zip"

# cd "$ROOT_DIR"

# echo "기존 GitHub Release 삭제"
# gh release delete "$VERSION" --yes || true

# echo "기존 local tag 삭제"
# git tag -d "$VERSION" || true

# echo "기존 remote tag 삭제"
# git push origin ":refs/tags/$VERSION" || true

# echo "이전 release 산출물 정리"
# rm -rf "$RELEASE_DIR"
# mkdir -p "$STAGING_DIR"

# echo "JS Bundle 생성"
# npm run bundle:ios
# npm run bundle:android

# echo "RN XCFramework 생성"
# (
#   cd "$SPM_SRC_DIR"
#   ./build_xcframeworks.sh
# )

# echo "SPM 패키지 staging"
# mkdir -p "$STAGING_DIR/$SPM_DIR_NAME"
# cp "$SPM_SRC_DIR/Package.swift" "$STAGING_DIR/$SPM_DIR_NAME/"
# ditto "$SPM_SRC_DIR/Sources" "$STAGING_DIR/$SPM_DIR_NAME/Sources"
# ditto "$SPM_SRC_DIR/Frameworks" "$STAGING_DIR/$SPM_DIR_NAME/Frameworks"

# echo "SPM zip 생성"
# ditto -c -k --sequesterRsrc --keepParent \
#   "$STAGING_DIR/$SPM_DIR_NAME" \
#   "$RELEASE_DIR/$SPM_ZIP_NAME"

# echo "iOS bundle zip 생성"
# ditto -c -k --sequesterRsrc --keepParent \
#   "$ROOT_DIR/dist/ios" \
#   "$RELEASE_DIR/$IOS_ZIP_NAME"

# echo "Android bundle zip 생성"
# ditto -c -k --sequesterRsrc --keepParent \
#   "$ROOT_DIR/dist/android" \
#   "$RELEASE_DIR/$ANDROID_ZIP_NAME"

# echo "새 tag 생성"
# git tag "$VERSION"

# echo "새 tag push"
# git push origin "$VERSION"

# echo "GitHub Release 생성"
# gh release create "$VERSION" \
#   "$RELEASE_DIR/$SPM_ZIP_NAME" \
#   "$RELEASE_DIR/$IOS_ZIP_NAME" \
#   "$RELEASE_DIR/$ANDROID_ZIP_NAME" \
#   --title "$VERSION" \
#   --notes "PopPang RN release $VERSION"

# echo "완료"
# echo "$RELEASE_DIR/$SPM_ZIP_NAME"
# echo "$RELEASE_DIR/$IOS_ZIP_NAME"
# echo "$RELEASE_DIR/$ANDROID_ZIP_NAME"



#!/bin/bash
set -euo pipefail

VERSION="${1:-}"

if [[ -z "$VERSION" ]]; then
  echo "사용법: ./scripts/release-rn.sh v0.1.0"
  exit 1
fi

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_DIR="$ROOT_DIR/release"
STAGING_DIR="$RELEASE_DIR/staging"

SPM_DIR_NAME="PrebuiltReactNativeFrameworks"
SPM_SRC_DIR="$ROOT_DIR/react_native_prebuild"
ANDROID_PREBUILD_SRC_DIR="$ROOT_DIR/react_native_android_prebuild"

IOS_BUNDLE_NAME="poppang-rn-ios-bundle-$VERSION"
ANDROID_BUNDLE_NAME="poppang-rn-android-bundle-$VERSION"
ANDROID_MAVEN_ZIP_NAME="poppang-rn-android-maven-$VERSION.zip"
SPM_ZIP_NAME="poppang-rn-spm-$VERSION.zip"
IOS_ZIP_NAME="$IOS_BUNDLE_NAME.zip"
ANDROID_ZIP_NAME="$ANDROID_BUNDLE_NAME.zip"

cd "$ROOT_DIR"

echo "이전 release 산출물 정리"
rm -rf "$RELEASE_DIR"
mkdir -p "$STAGING_DIR"

echo "루트 Node 의존성 설치"
npm ci

echo "JS Bundle 생성"
npm run bundle:ios
npm run bundle:android

echo "RN XCFramework 생성"
(
  cd "$SPM_SRC_DIR"
  ./build_xcframeworks.sh
)

echo "RN Android AAR 및 Maven 저장소 생성"
(
  cd "$ANDROID_PREBUILD_SRC_DIR"
  ./build_aars.sh "$VERSION"
)

echo "SPM 패키지 staging"
mkdir -p "$STAGING_DIR/$SPM_DIR_NAME"
cp "$SPM_SRC_DIR/Package.swift" "$STAGING_DIR/$SPM_DIR_NAME/"
ditto "$SPM_SRC_DIR/Sources" "$STAGING_DIR/$SPM_DIR_NAME/Sources"
ditto "$SPM_SRC_DIR/Frameworks" "$STAGING_DIR/$SPM_DIR_NAME/Frameworks"

echo "SPM zip 생성"
ditto -c -k --sequesterRsrc --keepParent \
  "$STAGING_DIR/$SPM_DIR_NAME" \
  "$RELEASE_DIR/$SPM_ZIP_NAME"

echo "iOS bundle zip 생성"
ditto -c -k --sequesterRsrc --keepParent \
  "$ROOT_DIR/dist/ios" \
  "$RELEASE_DIR/$IOS_ZIP_NAME"

echo "Android bundle zip 생성"
ditto -c -k --sequesterRsrc --keepParent \
  "$ROOT_DIR/dist/android" \
  "$RELEASE_DIR/$ANDROID_ZIP_NAME"

echo "Android Maven 저장소 staging"
cp \
  "$ANDROID_PREBUILD_SRC_DIR/output/$ANDROID_MAVEN_ZIP_NAME" \
  "$RELEASE_DIR/$ANDROID_MAVEN_ZIP_NAME"

# 빌드 산출물이 모두 성공한 뒤에만 기존 릴리즈를 교체한다.
echo "기존 GitHub Release 삭제"
gh release delete "$VERSION" --yes || true

echo "기존 local tag 삭제"
git tag -d "$VERSION" || true

echo "기존 remote tag 삭제"
git push origin ":refs/tags/$VERSION" || true

echo "새 tag 생성"
git tag "$VERSION"

echo "새 tag push"
git push origin "$VERSION"

echo "GitHub Release 생성"
gh release create "$VERSION" \
  "$RELEASE_DIR/$SPM_ZIP_NAME" \
  "$RELEASE_DIR/$IOS_ZIP_NAME" \
  "$RELEASE_DIR/$ANDROID_ZIP_NAME" \
  "$RELEASE_DIR/$ANDROID_MAVEN_ZIP_NAME" \
  --title "$VERSION" \
  --notes "PopPang RN release $VERSION"

echo "완료"
echo "$RELEASE_DIR/$SPM_ZIP_NAME"
echo "$RELEASE_DIR/$IOS_ZIP_NAME"
echo "$RELEASE_DIR/$ANDROID_ZIP_NAME"
echo "$RELEASE_DIR/$ANDROID_MAVEN_ZIP_NAME"
