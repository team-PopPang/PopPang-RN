# PopPang RN

PopPang RN은 iOS / Android 공용 화면을 React Native로 개발하고, 네이티브 앱에 삽입하기 위한 실험 및 산출물 생성 레포입니다.

이 레포에서는 두 가지 흐름을 제공합니다.

1. 팀원이 바로 확인할 수 있는 React Native 데모앱 실행
2. iOS / Android 네이티브 앱에 전달할 bundle 산출물 생성

## 구조

```txt
App.tsx
= RN 데모앱 실행용 루트

src/PopPangRNRoot.tsx
= iOS / Android 네이티브가 실제로 붙일 RN 루트

PopPang-RN/
├─ App.tsx                  # 데모앱 실행용
├─ index.js                 # 개발 실행 진입점
├─ native-entry.js          # iOS/AOS 산출물용 진입점
├─ src/
│  └─ PopPangRNRoot.tsx     # 네이티브 앱에 붙일 실제 RN 루트
└─ scripts/
   ├─ bundle-ios.sh
   └─ bundle-android.sh
```

## 빠른 실행
```bash
# 1. 의존성 설치
npm install

# 2. Metro 실행
npm run start

# 3. iOS 데모앱 실행
npm run ios

# 4. Android 데모앱 실행
npm run android
```

## Bundle 산출물 생성
```bash
# iOS bundle 생성
npm run bundle:ios

# 산출물
# dist/ios/main.jsbundle
# dist/ios/assets

# Android bundle 생성
npm run bundle:android

# 산출물
# dist/android/index.android.bundle
# dist/android/res

# iOS / Android bundle 모두 생성
npm run bundle:all
```

## 흐름
```bash
# 데모앱 실행 순서
npm run ios / npm run android
        ↓
index.js
        ↓
App.tsx
        ↓
PopPangRNRoot.tsx
        ↓
화면 표시


# 실제 iOS/AOS 앱에 삽입될 때
iOS / Android 네이티브 앱 실행
        ↓
main.jsbundle 또는 index.android.bundle 로드
        ↓
native-entry.js
        ↓
PopPangRNRoot.tsx
        ↓
화면 표시
```