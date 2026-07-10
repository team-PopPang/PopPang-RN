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
            targets: ["PrebuiltReactNativeFrameworks"]
        )
    ],
    targets: [
        .target(
            name: "PrebuiltReactNativeFrameworks",
            dependencies: [
                  "CoreModules",
                  "DoubleConversion",
                  "JSITooling",
                  "Pods_ReactNativePrebuild",
                  "RCTAnimation",
                  "RCTBlob",
                  "RCTDeprecation",
                  "RCTFabric",
                  "RCTImage",
                  "RCTLinking",
                  "RCTNetwork",
                  "RCTRuntime",
                  "RCTSettings",
                  "RCTSwiftUI",
                  "RCTSwiftUIWrapper",
                  "RCTText",
                  "RCTTypeSafety",
                  "RCTVibration",
                  "React",
                  "ReactAppDependencyProvider",
                  "ReactCodegen",
                  "ReactCommon",
                  "React_Fabric",
                  "React_FabricComponents",
                  "React_FabricImage",
                  "React_ImageManager",
                  "React_Mapbuffer",
                  "React_NativeModulesApple",
                  "React_RCTAppDelegate",
                  "React_RCTFBReactNativeSpec",
                  "React_RuntimeApple",
                  "React_RuntimeCore",
                  "React_RuntimeHermes",
                  "React_debug",
                  "React_defaultsnativemodule",
                  "React_domnativemodule",
                  "React_featureflags",
                  "React_featureflagsnativemodule",
                  "React_graphics",
                  "React_jserrorhandler",
                  "React_microtasksnativemodule",
                  "React_networking",
                  "React_performancecdpmetrics",
                  "React_performancetimeline",
                  "React_rendererconsistency",
                  "React_renderercss",
                  "React_rendererdebug",
                  "React_runtimeexecutor",
                  "React_runtimescheduler",
                  "React_utils",
                  "React_viewtransitionnativemodule",
                  "SocketRocket",
                  "cxxreact",
                  "fmt",
                  "folly",
                  "glog",
                  "idlecallbacksnativemodule",
                  "intersectionobservernativemodule",
                  "jsi",
                  "jsinspector_modern",
                  "jsinspector_moderncdp",
                  "jsinspector_modernnetwork",
                  "jsinspector_moderntracing",
                  "jsireact",
                  "logger",
                  "mutationobservernativemodule",
                  "oscompat",
                  "reacthermes",
                  "reactperflogger",
                  "webperformancenativemodule",
                  "yoga"
    ],
    path: "Sources",
    sources: ["dummy.swift"],
    linkerSettings: [
        .linkedLibrary("objc"),
        .linkedLibrary("c++"),
        .linkedLibrary("c++abi"),
        .linkedFramework("JavaScriptCore", .when(platforms: [.iOS])),
    ]
),
.binaryTarget(
    name: "CoreModules",
    path: "Frameworks/CoreModules.xcframework"
),
.binaryTarget(
    name: "DoubleConversion",
    path: "Frameworks/DoubleConversion.xcframework"
),
.binaryTarget(
    name: "JSITooling",
    path: "Frameworks/JSITooling.xcframework"
),
.binaryTarget(
    name: "Pods_ReactNativePrebuild",
    path: "Frameworks/Pods_ReactNativePrebuild.xcframework"
),
.binaryTarget(
    name: "RCTAnimation",
    path: "Frameworks/RCTAnimation.xcframework"
),
.binaryTarget(
    name: "RCTBlob",
    path: "Frameworks/RCTBlob.xcframework"
),
.binaryTarget(
    name: "RCTDeprecation",
    path: "Frameworks/RCTDeprecation.xcframework"
),
.binaryTarget(
    name: "RCTFabric",
    path: "Frameworks/RCTFabric.xcframework"
),
.binaryTarget(
    name: "RCTImage",
    path: "Frameworks/RCTImage.xcframework"
),
.binaryTarget(
    name: "RCTLinking",
    path: "Frameworks/RCTLinking.xcframework"
),
.binaryTarget(
    name: "RCTNetwork",
    path: "Frameworks/RCTNetwork.xcframework"
),
.binaryTarget(
    name: "RCTRuntime",
    path: "Frameworks/RCTRuntime.xcframework"
),
.binaryTarget(
    name: "RCTSettings",
    path: "Frameworks/RCTSettings.xcframework"
),
.binaryTarget(
    name: "RCTSwiftUI",
    path: "Frameworks/RCTSwiftUI.xcframework"
),
.binaryTarget(
    name: "RCTSwiftUIWrapper",
    path: "Frameworks/RCTSwiftUIWrapper.xcframework"
),
.binaryTarget(
    name: "RCTText",
    path: "Frameworks/RCTText.xcframework"
),
.binaryTarget(
    name: "RCTTypeSafety",
    path: "Frameworks/RCTTypeSafety.xcframework"
),
.binaryTarget(
    name: "RCTVibration",
    path: "Frameworks/RCTVibration.xcframework"
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
    name: "ReactCommon",
    path: "Frameworks/ReactCommon.xcframework"
),
.binaryTarget(
    name: "React_Fabric",
    path: "Frameworks/React_Fabric.xcframework"
),
.binaryTarget(
    name: "React_FabricComponents",
    path: "Frameworks/React_FabricComponents.xcframework"
),
.binaryTarget(
    name: "React_FabricImage",
    path: "Frameworks/React_FabricImage.xcframework"
),
.binaryTarget(
    name: "React_ImageManager",
    path: "Frameworks/React_ImageManager.xcframework"
),
.binaryTarget(
    name: "React_Mapbuffer",
    path: "Frameworks/React_Mapbuffer.xcframework"
),
.binaryTarget(
    name: "React_NativeModulesApple",
    path: "Frameworks/React_NativeModulesApple.xcframework"
),
.binaryTarget(
    name: "React_RCTAppDelegate",
    path: "Frameworks/React_RCTAppDelegate.xcframework"
),
.binaryTarget(
    name: "React_RCTFBReactNativeSpec",
    path: "Frameworks/React_RCTFBReactNativeSpec.xcframework"
),
.binaryTarget(
    name: "React_RuntimeApple",
    path: "Frameworks/React_RuntimeApple.xcframework"
),
.binaryTarget(
    name: "React_RuntimeCore",
    path: "Frameworks/React_RuntimeCore.xcframework"
),
.binaryTarget(
    name: "React_RuntimeHermes",
    path: "Frameworks/React_RuntimeHermes.xcframework"
),
.binaryTarget(
    name: "React_debug",
    path: "Frameworks/React_debug.xcframework"
),
.binaryTarget(
    name: "React_defaultsnativemodule",
    path: "Frameworks/React_defaultsnativemodule.xcframework"
),
.binaryTarget(
    name: "React_domnativemodule",
    path: "Frameworks/React_domnativemodule.xcframework"
),
.binaryTarget(
    name: "React_featureflags",
    path: "Frameworks/React_featureflags.xcframework"
),
.binaryTarget(
    name: "React_featureflagsnativemodule",
    path: "Frameworks/React_featureflagsnativemodule.xcframework"
),
.binaryTarget(
    name: "React_graphics",
    path: "Frameworks/React_graphics.xcframework"
),
.binaryTarget(
    name: "React_jserrorhandler",
    path: "Frameworks/React_jserrorhandler.xcframework"
),
.binaryTarget(
    name: "React_microtasksnativemodule",
    path: "Frameworks/React_microtasksnativemodule.xcframework"
),
.binaryTarget(
    name: "React_networking",
    path: "Frameworks/React_networking.xcframework"
),
.binaryTarget(
    name: "React_performancecdpmetrics",
    path: "Frameworks/React_performancecdpmetrics.xcframework"
),
.binaryTarget(
    name: "React_performancetimeline",
    path: "Frameworks/React_performancetimeline.xcframework"
),
.binaryTarget(
    name: "React_rendererconsistency",
    path: "Frameworks/React_rendererconsistency.xcframework"
),
.binaryTarget(
    name: "React_renderercss",
    path: "Frameworks/React_renderercss.xcframework"
),
.binaryTarget(
    name: "React_rendererdebug",
    path: "Frameworks/React_rendererdebug.xcframework"
),
.binaryTarget(
    name: "React_runtimeexecutor",
    path: "Frameworks/React_runtimeexecutor.xcframework"
),
.binaryTarget(
    name: "React_runtimescheduler",
    path: "Frameworks/React_runtimescheduler.xcframework"
),
.binaryTarget(
    name: "React_utils",
    path: "Frameworks/React_utils.xcframework"
),
.binaryTarget(
    name: "React_viewtransitionnativemodule",
    path: "Frameworks/React_viewtransitionnativemodule.xcframework"
),
.binaryTarget(
    name: "SocketRocket",
    path: "Frameworks/SocketRocket.xcframework"
),
.binaryTarget(
    name: "cxxreact",
    path: "Frameworks/cxxreact.xcframework"
),
.binaryTarget(
    name: "fmt",
    path: "Frameworks/fmt.xcframework"
),
.binaryTarget(
    name: "folly",
    path: "Frameworks/folly.xcframework"
),
.binaryTarget(
    name: "glog",
    path: "Frameworks/glog.xcframework"
),
.binaryTarget(
    name: "idlecallbacksnativemodule",
    path: "Frameworks/idlecallbacksnativemodule.xcframework"
),
.binaryTarget(
    name: "intersectionobservernativemodule",
    path: "Frameworks/intersectionobservernativemodule.xcframework"
),
.binaryTarget(
    name: "jsi",
    path: "Frameworks/jsi.xcframework"
),
.binaryTarget(
    name: "jsinspector_modern",
    path: "Frameworks/jsinspector_modern.xcframework"
),
.binaryTarget(
    name: "jsinspector_moderncdp",
    path: "Frameworks/jsinspector_moderncdp.xcframework"
),
.binaryTarget(
    name: "jsinspector_modernnetwork",
    path: "Frameworks/jsinspector_modernnetwork.xcframework"
),
.binaryTarget(
    name: "jsinspector_moderntracing",
    path: "Frameworks/jsinspector_moderntracing.xcframework"
),
.binaryTarget(
    name: "jsireact",
    path: "Frameworks/jsireact.xcframework"
),
.binaryTarget(
    name: "logger",
    path: "Frameworks/logger.xcframework"
),
.binaryTarget(
    name: "mutationobservernativemodule",
    path: "Frameworks/mutationobservernativemodule.xcframework"
),
.binaryTarget(
    name: "oscompat",
    path: "Frameworks/oscompat.xcframework"
),
.binaryTarget(
    name: "reacthermes",
    path: "Frameworks/reacthermes.xcframework"
),
.binaryTarget(
    name: "reactperflogger",
    path: "Frameworks/reactperflogger.xcframework"
),
.binaryTarget(
    name: "webperformancenativemodule",
    path: "Frameworks/webperformancenativemodule.xcframework"
),
.binaryTarget(
    name: "yoga",
    path: "Frameworks/yoga.xcframework"
)
    ]
)
