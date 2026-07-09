## 프로젝트 세팅 기록입니다(참고용)

1. React Native 데모 앱 생성
```bash
npx @react-native-community/cli@latest init PopPangRN --version 0.86.0 --skip-git-init
```

2. 생성된 파일을 루트로 이동
```bash
mv PopPangRN/* .
mv PopPangRN/.* . 2>/dev/null
rmdir PopPangRN
```

3. 의존성 설치
```bash
npm install
```

4. 폴더 생성
```bash
mkdir -p src/app
mkdir -p src/feature/Admin
mkdir -p src/feature/PopupRequest
mkdir -p src/component
mkdir -p src/shared
mkdir -p src/hooks
mkdir -p src/api
mkdir -p src/utils
mkdir -p scripts
mkdir -p dist
```

5. 번들 스크립트 생성
```bash
cat > scripts/bundle-ios.sh <<'EOF'
#!/bin/bash
set -e

rm -rf dist/ios
mkdir -p dist/ios

npx react-native bundle \
  --platform ios \
  --dev false \
  --entry-file index.js \
  --bundle-output dist/ios/main.jsbundle \
  --assets-dest dist/ios/assets
EOF

cat > scripts/bundle-android.sh <<'EOF'
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
EOF
```

6. 권한 설정
```bash
chmod +x scripts/*.sh
```

7. package.json에 scripts 추가
```bash
"bundle:ios": "bash scripts/bundle-ios.sh",
"bundle:android": "bash scripts/bundle-android.sh",
"bundle:all": "npm run bundle:ios && npm run bundle:android"
```

8. 실행법
```bash
# Metro
npm start

# iOS 데모 실행
cd ios
bundle install
bundle exec pod install
cd ..
npm run ios

# Android 데모 실행
npm run android
```

9. 배포 산출물 생성
```bash
npm run bundle:all
```

10. 앞으로 이 명령어만 치면 자동 릴리스
```bash
# chmod +x scripts/release-bundle.sh
#!/bin/bash
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "❌ 사용법: npm run release:bundle -- v0.1.0"
  exit 1
fi

RELEASE_NAME="poppang-rn-bundle-$VERSION"
ZIP_NAME="$RELEASE_NAME.zip"

echo "📦 Bundle 생성"
npm run bundle:all

echo "🗜️ Zip 압축"
rm -f "$ZIP_NAME"
zip -r "$ZIP_NAME" dist

echo "🏷️ Git tag 생성"
git tag "$VERSION"

echo "⬆️ Git tag push"
git push origin "$VERSION"

echo "🚀 GitHub Release 생성"
gh release create "$VERSION" "$ZIP_NAME" \
  --title "$RELEASE_NAME" \
  --notes "PopPang RN bundle release $VERSION"

echo "✅ Release 완료: $ZIP_NAME"
```

11. package.json에 추가
```bash
"release:bundle": "scripts/release-bundle.sh"
```

12. 실행법
```bash
# 1번 방식
npm run release:bundle -- v0.1.0

# 2번 방식
./scripts/release-bundle.sh v0.1.0
```