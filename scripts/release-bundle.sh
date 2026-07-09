# ./scripts/release-bundle.sh v0.1.0
# npm run release:bundle -- v0.1.0
#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "사용법: ./scripts/release-bundle.sh v0.1.0"
  exit 1
fi

RELEASE_NAME="poppang-rn-bundle-$VERSION"
ZIP_NAME="$RELEASE_NAME.zip"

echo "Bundle 생성"
npm run bundle:all

echo "Zip 압축"
rm -f "$ZIP_NAME"
zip -r "$ZIP_NAME" dist

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
gh release create "$VERSION" "$ZIP_NAME" \
  --title "$VERSION" \
  --notes "PopPang RN bundle release $VERSION"

echo "완료: $ZIP_NAME"