// swift-tools-version:5.6
import PackageDescription

let package = Package(
    name: "PrebuiltReactNativeFrameworks",
    platforms: [
        .iOS(.v11)
    ],
    products: [
        .library(
            name: "PrebuiltReactNativeFrameworks",
            targets: ["PrebuiltReactNativeFrameworks"]
        )
    ],
    targets: [
        .target(
            name: "PrebuiltReactNativeFrameworks",
            dependencies: [
                "ReactCodegen",
                "hermesvm",
                "Pods_ReactNativePrebuild",
                "ReactAppDependencyProvider"
    ],
    path: "Sources/",
    sources: ["dummy.swift"],
    linkerSettings: [
        .linkedLibrary("objc"),
        .linkedLibrary("c++"),
        .linkedLibrary("c++abi"),
        .linkedFramework("JavaScriptCore", .when(platforms: [.iOS]))
    ]
),
.binaryTarget(
    name: "ReactCodegen",
    path: "Frameworks/ReactCodegen.xcframework"
),
.binaryTarget(
    name: "hermesvm",
    path: "Frameworks/hermesvm.xcframework"
),
.binaryTarget(
    name: "Pods_ReactNativePrebuild",
    path: "Frameworks/Pods_ReactNativePrebuild.xcframework"
),
.binaryTarget(
    name: "ReactAppDependencyProvider",
    path: "Frameworks/ReactAppDependencyProvider.xcframework"
)
    ]
)
