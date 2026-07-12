frameworks_dir = "Frameworks"

frameworks = Dir.children(frameworks_dir)
  .select { |entry| entry.end_with?(".xcframework") }
  .sort

framework_names = frameworks.map { |entry| File.basename(entry, ".xcframework") }

package_swift_content = <<~SWIFT
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
SWIFT

framework_names.each_with_index do |name, index|
  comma = index < framework_names.size - 1 ? "," : ""
  package_swift_content << "                  \"#{name}\"#{comma}\n"
end

package_swift_content << <<~SWIFT
              ],
              path: "Sources",
              sources: ["dummy.swift"],
              linkerSettings: [
                  // CocoaPods의 OTHER_LDFLAGS 중 시스템 의존성만 옮긴다.
                  // 공통 iOS 시스템 링크 설정
                  .unsafeFlags(["-ObjC"]),
                  .linkedLibrary("objc"),
                  .linkedLibrary("c++"),
                  .linkedLibrary("c++abi"),
                  .linkedLibrary("icucore"),
                  .linkedFramework("Accelerate", .when(platforms: [.iOS])),
                  .linkedFramework("AudioToolbox", .when(platforms: [.iOS])),
                  .linkedFramework("CFNetwork", .when(platforms: [.iOS])),
                  .linkedFramework("CoreGraphics", .when(platforms: [.iOS])),
                  .linkedFramework("ImageIO", .when(platforms: [.iOS])),
                  .linkedFramework("JavaScriptCore", .when(platforms: [.iOS])),
                  .linkedFramework("MobileCoreServices", .when(platforms: [.iOS])),
                  .linkedFramework("QuartzCore", .when(platforms: [.iOS])),
                  .linkedFramework("Security", .when(platforms: [.iOS])),
                  .linkedFramework("UIKit", .when(platforms: [.iOS])),

                  // 이미지 선택/미디어 처리 네이티브 모듈이 요구하는 iOS 시스템 프레임워크
                  .linkedFramework("AVFoundation", .when(platforms: [.iOS])),
                  .linkedFramework("CoreMedia", .when(platforms: [.iOS])),
                  .linkedFramework("Photos", .when(platforms: [.iOS])),
                  .linkedFramework("PhotosUI", .when(platforms: [.iOS])),
              ]
          ),
SWIFT

framework_names.each_with_index do |name, index|
  comma = index < framework_names.size - 1 ? "," : ""
  package_swift_content << <<~SWIFT
          .binaryTarget(
              name: "#{name}",
              path: "Frameworks/#{name}.xcframework"
          )#{comma}
  SWIFT
end

package_swift_content << <<~SWIFT
      ]
  )
SWIFT

File.write("Package.swift", package_swift_content)
puts "Package.swift generated successfully!"
