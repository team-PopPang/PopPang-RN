# PopPang RN

PopPang RN은 iOS와 Android에서 공통으로 사용할 화면을 React Native로 개발하는 프로젝트예요.

이 프로젝트에서는 두 가지 작업을 할 수 있어요.

- React Native 데모 앱을 실행해 화면을 개발하고 확인해요.
- iOS와 Android 네이티브 앱에 전달할 bundle과 프레임워크를 만들어요.

## 구조

```text
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
├─ react_native_prebuild/
│  └─ iOS용 React Native XCFramework 생성 도구
└─ scripts/
   ├─ bundle-ios.sh
   ├─ bundle-android.sh
   └─ release-rn.sh
```

## 프로젝트는 목적에 따라 진입점을 나눠 사용해요.

| 목적 | 진입점 | 루트 화면 |
| --- | --- | --- |
| 데모 앱 개발 | `index.js` | `App.tsx` |
| 네이티브 앱 삽입 | `native-entry.js` | `src/PopPangRNRoot.tsx` |

## 세팅 방법
```bash
# 처음 프로젝트를 받았거나 `node_modules`를 깨끗하게 다시 설치할 때는 `npm ci`를 사용하세요.
cd PopPang-RN
npm ci
```

## Demo 앱 실행 방법
```bash
# 1. Metro 개발 서버를 실행하세요.(Metro는 데모 앱 실행과 JavaScript bundle 생성에 사용해요.)
npm run start

# 2. Metro를 실행한 터미널은 그대로 둔 뒤, 새 터미널에서 실행하세요.
npm run ios

# 3. 마찬가지로 새 터미널에서 실행하세요.
npm run android
```

## 모듈 배포 방법
```bash
# ./scripts/release-rn.sh 버전명
./scripts/release-rn.sh v0.1.0
```

## 클라이언트 프로젝트(iOS)
- iOS 클라이언트 프로젝트에 아래 스크립트를 `scripts/download-rn-release.sh`로 추가하세요.
- 스크립트는 지정한 릴리즈 버전의 iOS bundle과 SPM 패키지를 다운로드해 프로젝트에 적용해요.

<details>
<summary>다운로드 스크립트 전체 보기</summary>

```bash
#!/bin/bash
set -euo pipefail

VERSION="${1:-v0.1.0}"

REPO="team-PopPang/PopPang-RN"

BUNDLE_ASSET_NAME="poppang-rn-ios-bundle-$VERSION.zip"
FRAMEWORK_ASSET_NAME="poppang-rn-spm-$VERSION.zip"

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

BUNDLE_OUTPUT_DIR="$ROOT_DIR/PopPangBrownField/Resources/ReactNative"
FRAMEWORK_OUTPUT_DIR="$ROOT_DIR/PopPangBrownField/Vendor/PrebuiltReactNativeFrameworks"

TMP_DIR="$ROOT_DIR/.rn-release-temp"

echo "RN 릴리즈 다운로드 시작: $VERSION"

rm -rf "$TMP_DIR"
mkdir -p "$TMP_DIR"

echo "iOS 번들 다운로드"
gh release download "$VERSION" \
  --repo "$REPO" \
  --pattern "$BUNDLE_ASSET_NAME" \
  --dir "$TMP_DIR" \
  --clobber

echo "SPM 패키지 다운로드"
gh release download "$VERSION" \
  --repo "$REPO" \
  --pattern "$FRAMEWORK_ASSET_NAME" \
  --dir "$TMP_DIR" \
  --clobber

echo "iOS 번들 압축 해제"
mkdir -p "$TMP_DIR/bundle"
unzip -o "$TMP_DIR/$BUNDLE_ASSET_NAME" -d "$TMP_DIR/bundle"

echo "SPM 패키지 압축 해제"
mkdir -p "$TMP_DIR/frameworks"
unzip -o "$TMP_DIR/$FRAMEWORK_ASSET_NAME" -d "$TMP_DIR/frameworks"

echo "iOS 번들 복사"
rm -rf "$BUNDLE_OUTPUT_DIR"
mkdir -p "$BUNDLE_OUTPUT_DIR"

cp "$TMP_DIR/bundle/ios/main.jsbundle" "$BUNDLE_OUTPUT_DIR/main.jsbundle"

if [ -d "$TMP_DIR/bundle/ios/assets" ]; then
  cp -R "$TMP_DIR/bundle/ios/assets" "$BUNDLE_OUTPUT_DIR/assets"
fi

echo "프레임워크 패키지 복사"
rm -rf "$FRAMEWORK_OUTPUT_DIR"
mkdir -p "$(dirname "$FRAMEWORK_OUTPUT_DIR")"

ditto \
  "$TMP_DIR/frameworks/PrebuiltReactNativeFrameworks" \
  "$FRAMEWORK_OUTPUT_DIR"

rm -rf "$TMP_DIR"

echo "다운로드 및 적용 완료"
echo "번들 위치: $BUNDLE_OUTPUT_DIR"
echo "프레임워크 위치: $FRAMEWORK_OUTPUT_DIR"
```

```bash
# 실행 권한 추가
chmod +x scripts/download-rn-release.sh

# v0.1.0 릴리즈 다운로드 및 적용
./scripts/download-rn-release.sh v0.1.0
```
</details>

<details>
<summary>SwiftUI에서 React Native 화면 열기</summary>

### 준비

- 다운로드한 `PrebuiltReactNativeFrameworks` SPM 패키지를 앱 타겟에 연결하세요.
- `main.jsbundle`을 앱의 `Copy Bundle Resources`에 포함하세요.
- `native-entry.js`에서 등록한 모듈 이름과 Swift의 `moduleName`을 같게 설정하세요.

```text
native-entry.js
  → PopPangRNRoot 등록

Swift
  → moduleName: "PopPangRNRoot"
```

### 구현

```swift
import SwiftUI
import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

// Debug에서는 Metro를, Release에서는 앱에 포함한 main.jsbundle을 사용한다.
final class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
    override func sourceURL(for bridge: RCTBridge) -> URL? {
        bundleURL()
    }

    override func bundleURL() -> URL? {
#if DEBUG
        return RCTBundleURLProvider.sharedSettings()
            .jsBundleURL(forBundleRoot: "index")
#else
        if let url = Bundle.main.url(
            forResource: "main",
            withExtension: "jsbundle",
            subdirectory: "ReactNative"
        ) {
            return url
        }

        if let url = Bundle.main.url(
            forResource: "main",
            withExtension: "jsbundle"
        ) {
            return url
        }

        fatalError(
            """
            main.jsbundle을 찾을 수 없습니다.
            Build Phases > Copy Bundle Resources를 확인하세요.
            """
        )
#endif
    }
}

// React Native Factory와 Delegate를 화면이 살아 있는 동안 유지한다.
final class ReactViewController: UIViewController {
    private let moduleName: String
    private let initialProperties: [String: Any]?

    private var reactNativeFactory: RCTReactNativeFactory?
    private var reactNativeFactoryDelegate: RCTReactNativeFactoryDelegate?

    init(
        moduleName: String,
        initialProperties: [String: Any]? = nil
    ) {
        self.moduleName = moduleName
        self.initialProperties = initialProperties
        super.init(nibName: nil, bundle: nil)
    }

    @available(*, unavailable)
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    override func viewDidLoad() {
        super.viewDidLoad()

        let delegate = ReactNativeDelegate()
        delegate.dependencyProvider = RCTAppDependencyProvider()

        let factory = RCTReactNativeFactory(delegate: delegate)

        reactNativeFactoryDelegate = delegate
        reactNativeFactory = factory

        view = factory.rootViewFactory.view(
            withModuleName: moduleName,
            initialProperties: initialProperties
        )
    }
}

// UIKit 기반 React Native 화면을 SwiftUI에서 사용할 수 있게 감싼다.
struct ReactNativeScreen: UIViewControllerRepresentable {
    let moduleName: String
    let initialProperties: [String: Any]?

    init(
        moduleName: String,
        initialProperties: [String: Any]? = nil
    ) {
        self.moduleName = moduleName
        self.initialProperties = initialProperties
    }

    func makeUIViewController(context: Context) -> ReactViewController {
        ReactViewController(
            moduleName: moduleName,
            initialProperties: initialProperties
        )
    }

    func updateUIViewController(
        _ uiViewController: ReactViewController,
        context: Context
    ) {}
}

struct ContentView: View {
    var body: some View {
        ReactNativeScreen(
            moduleName: "PopPangRNRoot",
            initialProperties: [
                "name": "PopPangBrownField"
            ]
        )
        .ignoresSafeArea()
    }
}
```

### 동작 방식

```text
Debug
Metro의 index.js 로드
  → App.tsx
  → PopPangRNRoot 화면 표시

Release
앱에 포함된 main.jsbundle 로드
  → native-entry.js
  → PopPangRNRoot 화면 표시
```

</details>

## 의존성 추가

<details>
<summary>의존성 추가 방법</summary>

새 라이브러리는 프로젝트 루트의 `package.json`에만 추가해요.  
`npm install`을 실행하면 `package.json`과 `package-lock.json`이 함께 갱신돼요.

### 앱 실행에 필요한 라이브러리

React Native 화면에서 사용하는 라이브러리는 `dependencies`에 추가해요.

```bash
npm install react-native-safe-area-context
```

### 개발 도구

테스트, 린트, 빌드 도구는 `devDependencies`에 추가해요.

```bash
npm install --save-dev eslint-plugin-import
```

`react_native_prebuild/`에는 의존성을 추가하지 않아요.  
이 폴더는 프로젝트 루트의 `node_modules`를 사용해 iOS용 XCFramework를 만들어요.

</details>

## 참고
```bash
# 새 라이브러리를 추가하거나 삭제할 때는 `npm install`을 사용하세요.
# 라이브러리 추가
npm install react-native-safe-area-context

# 라이브러리 삭제
npm uninstall react-native-safe-area-context
```
> 라이브러리를 추가하거나 삭제할 때만 `npm install`을 사용해요.  
> 그 외 개발 환경 설치와 릴리즈 빌드에는 `npm ci`를 사용해요.








<!-- - `npm install`은 `package.json`과 `package-lock.json`을 함께 갱신해요. 변경한 `package.json`과 `package-lock.json`은 함께 커밋하세요.
- `npm ci`는 `package-lock.json`에 기록된 정확한 버전을 설치해요. 처음 설치, CI, 릴리즈 스크립트에서는 항상 `npm ci`를 사용해요. -->

<!-- ## Bundle 산출물 생성
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
``` -->

<!-- ## 흐름
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
``` -->