#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "사용법: ./scripts/release-rn.sh v0.1.0"
  exit 1
fi

BUNDLE_RELEASE_NAME="poppang-rn-bundle-$VERSION"
FRAMEWORK_RELEASE_NAME="poppang-rn-frameworks-$VERSION"

BUNDLE_ZIP_NAME="$BUNDLE_RELEASE_NAME.zip"
FRAMEWORK_ZIP_NAME="$FRAMEWORK_RELEASE_NAME.zip"

echo "JS Bundle 생성"
npm run bundle:all

echo "RN XCFramework 생성"
cd react_native_prebuild
./build_xcframeworks.sh
cd ..

echo "Bundle Zip 압축"
rm -f "$BUNDLE_ZIP_NAME"
zip -r "$BUNDLE_ZIP_NAME" dist

echo "Frameworks Zip 압축"
rm -f "$FRAMEWORK_ZIP_NAME"
cd react_native_prebuild
zip -r "../$FRAMEWORK_ZIP_NAME" \
  Package.swift \
  Sources \
  Frameworks
cd ..

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

echo "GitHub Release 재생성"
gh release create "$VERSION" \
  "$BUNDLE_ZIP_NAME" \
  "$FRAMEWORK_ZIP_NAME" \
  --title "$VERSION" \
  --notes "PopPang RN release $VERSION"

echo "완료"
echo "$BUNDLE_ZIP_NAME"
echo "$FRAMEWORK_ZIP_NAME"