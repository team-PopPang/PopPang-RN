// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "PrebuiltReactNativeFrameworks",
    platforms: [
        .iOS(.v17)
    ],
    products: [
        .library(
            name: "PrebuiltReactNativeFrameworks",
          targets: ["PrebuiltReactNativeFrameworks", "PopPangReactNativeHost"]
        )
    ],
    targets: [
        .target(
            name: "PrebuiltReactNativeFrameworks",
            dependencies: [
                  "Pods_ReactNativePrebuild",
                  "RNDateTimePicker",
                  "RNScreens",
                  "React",
                  "ReactAppDependencyProvider",
                  "ReactCodegen",
                  "ReactNativeDependencies",
                  "React_RCTAppDelegate",
                  "hermesvm",
                  "react_native_blob_util",
                  "react_native_image_picker",
                  "react_native_safe_area_context"
              ],
              path: "Sources",
              sources: ["dummy.swift"],
              linkerSettings: [
                  // CocoaPods aggregate target의 OTHER_LDFLAGS에서 시스템 링크 설정을 자동 추출한다.
                  // 공통 linker flags
                  .unsafeFlags(["-ObjC"]),

                  // 시스템 라이브러리
                  .linkedLibrary("c++"),

                  // iOS 시스템 프레임워크
                  .linkedFramework("AVFoundation", .when(platforms: [.iOS])),
                  .linkedFramework("Accelerate", .when(platforms: [.iOS])),
                  .linkedFramework("AudioToolbox", .when(platforms: [.iOS])),
                  .linkedFramework("CoreGraphics", .when(platforms: [.iOS])),
                  .linkedFramework("CoreMedia", .when(platforms: [.iOS])),
                  .linkedFramework("ImageIO", .when(platforms: [.iOS])),
                  .linkedFramework("MobileCoreServices", .when(platforms: [.iOS])),
                  .linkedFramework("Photos", .when(platforms: [.iOS])),
                  .linkedFramework("PhotosUI", .when(platforms: [.iOS])),
                  .linkedFramework("QuartzCore", .when(platforms: [.iOS])),
                  .linkedFramework("UIKit", .when(platforms: [.iOS])),

                  // 약한 링크가 필요한 iOS 시스템 프레임워크
                  .unsafeFlags(["-weak_framework", "JavaScriptCore"], .when(platforms: [.iOS])),
              ]
          ),
          .target(
              name: "PopPangReactNativeHost",
              dependencies: ["React"],
              path: "HostSources",
              publicHeadersPath: "include",
              linkerSettings: [
                  .unsafeFlags(["-ObjC"])
              ]
          ),
.binaryTarget(
    name: "Pods_ReactNativePrebuild",
    path: "Frameworks/Pods_ReactNativePrebuild.xcframework"
),
.binaryTarget(
    name: "RNDateTimePicker",
    path: "Frameworks/RNDateTimePicker.xcframework"
),
.binaryTarget(
    name: "RNScreens",
    path: "Frameworks/RNScreens.xcframework"
),
.binaryTarget(
    name: "React",
    path: "Frameworks/React.xcframework"
),
.binaryTarget(
    name: "ReactAppDependencyProvider",
    path: "Frameworks/ReactAppDependencyProvider.xcframework"
),
.binaryTarget(
    name: "ReactCodegen",
    path: "Frameworks/ReactCodegen.xcframework"
),
.binaryTarget(
    name: "ReactNativeDependencies",
    path: "Frameworks/ReactNativeDependencies.xcframework"
),
.binaryTarget(
    name: "React_RCTAppDelegate",
    path: "Frameworks/React_RCTAppDelegate.xcframework"
),
.binaryTarget(
    name: "hermesvm",
    path: "Frameworks/hermesvm.xcframework"
),
.binaryTarget(
    name: "react_native_blob_util",
    path: "Frameworks/react_native_blob_util.xcframework"
),
.binaryTarget(
    name: "react_native_image_picker",
    path: "Frameworks/react_native_image_picker.xcframework"
),
.binaryTarget(
    name: "react_native_safe_area_context",
    path: "Frameworks/react_native_safe_area_context.xcframework"
)
    ]
)
