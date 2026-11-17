# PopPang RN

PopPang RN은 iOS와 Android 앱이 함께 쓰는 화면(팝업 제보, 팝업 제보 관리)을 React Native로 만드는 프로젝트예요.

- React Native 데모 앱으로 화면을 개발하고 확인해요.
- [Nativepiece](https://github.com/team-PopPang/Nativepiece)로 화면을 모듈로 만들어 배포해요. iOS는 Swift Package, Android는 Maven 의존성 하나로 받아요.

## 구조

```text
PopPang-RN/
├─ App.tsx                        # 데모 앱 루트 (Debug: 데모 피처 목록)
├─ index.js                       # 데모 앱 진입점
├─ nativepiece.config.ts          # 모듈 설정 (이름 PopPangRN, iOS 17.0, Android 좌표)
├─ nativepiece.contract.ts        # 앱과 주고받는 화면·이벤트·호출 계약
├─ nativepiece.entry.ts           # 모듈 진입점. 계약의 화면과 컴포넌트를 연결
├─ src/
│  ├─ nativepiece/                # 화면 루트, 열린 화면의 호스트 보관
│  ├─ native/                     # 호스트 앱 연결 (이벤트·Access Token)
│  ├─ api/                        # V2 API 요청 (Access Token, 401 재시도)
│  ├─ PopPangDesignSystem/        # 공통 토큰·헤더·폼·선택 칩 UI
│  ├─ demo/                       # 데모용 피처 목록
│  └─ Features/
│     ├─ PopupRequest/            # 팝업 제보
│     └─ PopupRequestManagement/  # 팝업 제보 관리
├─ Package.swift, swift-package/  # iOS 배포 때 Nativepiece가 만들어 커밋 (직접 고치지 않아요)
└─ .nativepiece/                  # 빌드 작업 공간과 결과물 (git 제외)
```

## 세팅 방법

Nativepiece 패키지는 GitHub Packages(team-PopPang 조직 전용)에 있어요. `read:packages` 권한이 있는 토큰이 필요해요. 토큰은 파일에 넣지 않고 환경 변수로 넘겨요.

```bash
git clone https://github.com/team-PopPang/PopPang-RN.git
cd PopPang-RN

gh auth refresh -h github.com -s read:packages   # 처음 한 번
export NODE_AUTH_TOKEN=$(gh auth token)
npm ci
npx nativepiece doctor
```

> 라이브러리를 추가하거나 삭제할 때만 `npm install`을 사용해요.
> 그 외 개발 환경 설치와 배포 빌드에는 `npm ci`를 사용해요.

## Demo 앱 실행 방법

```bash
# 1. Metro 개발 서버 실행
npm run start

# 2. 새 터미널에서 iOS 데모 앱 실행
npm run ios

# 3. 새 터미널에서 Android 데모 앱 실행
npm run android
```

실제 기기는 `npm run ios -- --list-devices`로 고른 뒤 `npm run ios -- --device "<이름 또는 UDID>"`로 실행해요.

## 계약

앱과 RN이 주고받는 것은 `nativepiece.contract.ts` 하나에 정해요. `npx nativepiece codegen`(빌드할 때 자동)이 이 파일로 Swift·Kotlin 타입을 만들어요.

| 종류 | 이름 | 내용 |
| --- | --- | --- |
| 화면 | `popupRequest` | 팝업 제보. props `userUuid`(입력 검증에만 써요) |
| 화면 | `popupRequestManagement` | 관리자 팝업 제보 관리. props `userUuid` |
| 이벤트 (RN → 앱) | `popupRequestSubmitted` | 제보가 등록되고 완료 알림의 확인을 눌렀어요 |
| 닫기 (RN → 앱) | 표준 `close` | 두 화면의 헤더 뒤로가기. 앱의 `onClose`로 와요 |
| 호출 (RN → 앱 → RN) | `getAccessToken` | V2 API용 Access Token ([V2 API 인증 토큰](#v2-api-인증-토큰)) |

### V2 API 인증 토큰

두 화면은 V2 API(`https://poppang.co.kr/api/v2`)를 Access Token으로 불러요. RN은 토큰을 저장하지 않고, 요청할 때마다 `getAccessToken`으로 앱에 받아요. 토큰 저장과 갱신은 앱이 맡아요.

| 언제 | `rejectedAccessToken` | `expired` | 앱이 할 일 |
| --- | --- | --- | --- |
| 요청 전 | `nil` | `false` | 저장된 Access Token을 돌려줘요. 없으면 `login_required`로 거절해요. |
| 401, 서버 코드 5002(만료) | 그 요청에 담은 토큰 | `true` | 그 토큰을 만료된 토큰으로 갱신해요. 다른 요청이 이미 갱신했으면 새 토큰을 돌려줘요. |
| 401, 다른 코드 | 그 요청에 담은 토큰 | `false` | 그 토큰이 아직 저장돼 있으면 로그아웃하고 `login_required`로 거절해요. 그사이 바뀌었으면 새 토큰을 돌려줘요. |

- RN은 401 뒤 받은 토큰으로 한 번만 다시 보내요. 두 번째도 401이면 다시 로그인하라는 안내를 보여요.
- 앱이 토큰을 주지 못하면 `NativepieceCallError` code로 이유를 알려요. RN이 안내 문구로 바꿔요.

| code | RN 안내 |
| --- | --- |
| `login_required` | 로그인 정보가 만료되었습니다. 다시 로그인해 주세요. |
| `temporary_failure` | 로그인 정보를 잠시 확인하지 못했습니다. 잠시 후 다시 시도해 주세요. |
| `unhandled` (앱이 구현하지 않음) | 로그인 정보를 확인할 수 없습니다. 앱을 최신 버전으로 업데이트해 주세요. |

## 앱에서 쓰기

### iOS

Xcode(또는 Tuist `Package.swift`)에서 `https://github.com/team-PopPang/PopPang-RN`을 **Exact Version**으로 추가하고 `PopPangRN` 제품을 앱 타깃에 넣어요. 저장소가 공개라 토큰은 필요 없어요.

```swift
import NativepieceKit
import PopPangRN

@MainActor
final class PopPangRNBridge: PopPangRNHost {
    func getAccessToken(_ request: PopPangRN.GetAccessTokenRequest) async throws -> PopPangRN.GetAccessTokenResponse {
        // 위 표의 규칙으로 토큰을 정한다. 줄 수 없으면 code로 이유를 알린다.
        // throw NativepieceCallError(code: "login_required", message: "...")
        .init(accessToken: token)
    }
}

// 앱 시작 시 한 번. host는 앱이 살아 있는 동안 강하게 참조돼요.
PopPangRN.start(host: PopPangRNBridge())

// SwiftUI
NativepieceView(PopPangRN.Screen.popupRequest(.init(userUuid: userUuid)))
    .onEvent(PopPangRN.Event.self) { event in
        if case .popupRequestSubmitted = event { dismiss() }
    }
    .onClose { dismiss() }
```

UIKit에서는 `NativepieceViewController`를 써요.

### Android

```kotlin
// settings.gradle(.kts): https://maven.pkg.github.com/team-PopPang/PopPang-RN (read:packages 토큰), google(), mavenCentral()
implementation("com.poppang:poppang-rn-android:<버전>")
implementation("com.poppang:poppang-rn-android-compose:<버전>")   // Jetpack Compose를 쓸 때

class PopPangRNBridge : PopPangRN.Host {
    override fun getAccessToken(
        request: PopPangRN.GetAccessTokenRequest,
        reply: NativepieceTypedReply<PopPangRN.GetAccessTokenResponse>,
    ) {
        reply.resolve(PopPangRN.GetAccessTokenResponse(accessToken = token))
        // 줄 수 없으면 reply.reject("login_required", "...")
    }
}

// Application.onCreate
PopPangRN.start(this, PopPangRNBridge())

PopPangRNScreen(
    screen = PopPangRN.Screen.PopupRequest(PopPangRN.PopPangScreenProps(userUuid = userUuid)),
    onEvent = { if (it is PopPangRN.Event.PopupRequestSubmitted) navController.popBackStack() },
    onClose = { navController.popBackStack() },
)
```

View 기반 화면에서는 `NativepieceSurface`, `NativepieceFragment`, `NativepieceActivity`를 써요.

## 모듈 배포 방법

`package.json`의 `version`을 올려 PR로 main에 머지한 뒤, main에서 실행해요. 같은 버전은 다시 배포되지 않아요.

```bash
git switch main && git pull
export NODE_AUTH_TOKEN=$(gh auth token)
npm ci

# iOS: 이 레포에 Package.swift·swift-package/ 커밋, 버전 태그(예: 1.3.0), GitHub Release(XCFramework zip)
npm run nativepiece:build:ios && npm run nativepiece:publish:ios

# Android: GitHub Packages Maven (토큰에 write:packages 필요)
npm run nativepiece:build:android && npm run nativepiece:publish:android
```

- 배포 전 확인만 하려면 `npx nativepiece publish ios --dry-run`처럼 `--dry-run`을 붙여요. 아무것도 올리지 않고 `.nativepiece/publish/`에 결과만 만들어요.
- iOS 배포는 커밋하지 않은 변경이 있거나, main이 아니거나, origin과 다르거나, 이미 있는 버전이면 멈춰요.
- `v1.2.0`까지는 이전 방식(`release-rn.sh`, zip 다운로드)으로 배포했어요. `1.3.0`부터 Nativepiece로 배포해요. 태그 형식도 `v` 없이 `1.3.0`이에요.
- `1.3.0` iOS 패키지는 JS 번들과 일부 이미지가 `.gitignore`(`*.jsbundle`, `node_modules/`)에 걸려 빠졌어요. 쓰지 말고 `1.4.0` 이상을 써요. Nativepiece `0.1.3`부터 배포할 때 이런 파일을 강제로 커밋하고 빠졌는지 확인해요.

## 의존성 추가

새 라이브러리는 프로젝트 루트의 `package.json`에만 추가해요. 네이티브 모듈은 Nativepiece가 autolinking으로 찾아 iOS XCFramework와 Android AAR에 넣어요. 추가한 뒤 `npx nativepiece doctor`로 호환성을 확인해요.

```bash
npm install react-native-safe-area-context          # 앱 실행에 필요한 라이브러리
npm install --save-dev eslint-plugin-import         # 테스트·린트·빌드 도구
npm uninstall react-native-safe-area-context        # 삭제
```

## 문제 해결

### Metro 캐시 초기화

```bash
pkill -f "react-native/cli.js start" || true
watchman watch-del-all || true
rm -rf $TMPDIR/metro-* $TMPDIR/haste-map-*

npm start -- --reset-cache
```

### iOS Pods 초기화

```bash
rm -rf ios/Pods ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/PopPangRN-*

cd ios
bundle exec pod install
cd ..

npm run ios
```

### Android 캐시 초기화

```bash
cd android
./gradlew --stop
cd ..

rm -rf ~/.gradle/caches/9.3.1/transforms
rm -rf android/.gradle android/build android/app/build

cd android
./gradlew assembleDebug --refresh-dependencies
cd ..

npm run android
```

### iOS 사진 선택 후 이미지 업로드가 4307로 실패하는 경우

RN 이미지 선택기는 사진 앱의 원본 경로를 애플리케이션에 직접 전달하지 않아요. 선택한 사진을 앱 전용 임시 저장소에 준비한 뒤 URI, 파일명, MIME 타입을 반환해요. 이 과정에서 iOS가 전달할 이미지 표현을 고르므로 원본 사진 정보와 임시 파일 정보가 다를 수 있어요.

PopPang 백엔드는 업로드 이미지의 파일 확장자와 MIME 타입을 함께 검사해요.

| 파일 확장자 | MIME 타입 |
| --- | --- |
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.png` | `image/png` |
| `.heic` | `image/heic` |
| `.heif` | `image/heif` |

PopupRequest에서는 사진 선택 시 `assetRepresentationMode: 'current'`를 사용해 현재 이미지 표현을 요청해요. 선택 결과는 업로드 전에 다음 규칙으로 검증해요.

- `image/jpg`는 표준 MIME 타입인 `image/jpeg`로 정규화해요.
- 대문자 확장자는 소문자로 비교해요.
- 파일명이 없으면 MIME 타입과 일치하는 임시 업로드 이름을 만들어요.
- 확장자와 MIME 타입이 일치하지 않거나 지원하지 않는 형식이면 업로드하지 않고 사용자에게 안내해요.
- 이미지 데이터는 JPEG로 변환하거나 재압축하지 않으므로 화질은 변경되지 않아요.

파일명만 `.jpg`로 바꾸거나 MIME 타입만 `image/jpeg`로 덮어쓰면 이미지 데이터와 메타데이터가 달라질 수 있어요. 그래서 불일치 파일은 임의로 수정하지 않고 선택 단계에서 차단해요.
