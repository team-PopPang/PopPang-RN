require "set"
require "shellwords"

frameworks_dir = ENV.fetch("POPPANG_FRAMEWORKS_DIR", "Frameworks")
package_swift_path = ENV.fetch("POPPANG_PACKAGE_SWIFT_PATH", "Package.swift")
pods_target_support_dir = File.join(
  "Pods",
  "Target Support Files",
  "Pods-ReactNativePrebuild"
)
xcconfig_paths = %w[debug release].map do |configuration|
  File.join(
    pods_target_support_dir,
    "Pods-ReactNativePrebuild.#{configuration}.xcconfig"
  )
end

# Frameworks 디렉터리에서 내부 binary target 이름 목록을 만든다.
def load_framework_names(frameworks_dir)
  Dir.children(frameworks_dir)
    .select { |entry| entry.end_with?(".xcframework") }
    .sort
    .map { |entry| File.basename(entry, ".xcframework") }
end

# xcconfig 파일에서 지정한 key의 값을 읽는다.
# 줄 끝의 "\"도 이어 붙여 CocoaPods가 만든 multiline assignment를 복원한다.
def read_xcconfig_assignment(xcconfig_path, key)
  raise "#{xcconfig_path} not found." unless File.exist?(xcconfig_path)

  collecting = false
  value = +""

  File.readlines(xcconfig_path, chomp: true).each do |line|
    stripped = line.strip
    next if stripped.empty?

    if !collecting
      next unless stripped.start_with?("#{key} =")

      collecting = true
      value = stripped.split("=", 2).last.strip
    else
      value << " #{stripped}"
    end

    if value.end_with?("\\")
      value = value[0...-1].rstrip
      next
    end

    return value
  end

  raise "#{key} not found in #{xcconfig_path}." if value.empty?

  value
end

# aggregate target의 OTHER_LDFLAGS를 읽어 SwiftPM linkerSettings용 데이터로 분류한다.
# 내부 xcframework 이름과 겹치는 항목은 system framework가 아니므로 제외한다.
def load_linker_flags(xcconfig_paths, internal_framework_names)
  linker_flags = {
    unsafe_flags: Set.new,
    libraries: Set.new,
    frameworks: Set.new,
    weak_frameworks: Set.new
  }

  xcconfig_paths.each do |xcconfig_path|
    tokens = Shellwords.split(read_xcconfig_assignment(xcconfig_path, "OTHER_LDFLAGS"))
    index = 0

    while index < tokens.length
      token = tokens[index]

      case token
      when "$(inherited)"
        # SwiftPM 패키지에는 CocoaPods의 inherited 설정이 필요 없다.
      when "-ObjC"
        linker_flags[:unsafe_flags] << token
      when /\A-l(.+)\z/
        linker_flags[:libraries] << Regexp.last_match(1)
      when "-framework"
        framework_name = tokens[index + 1]
        unless internal_framework_names.include?(framework_name)
          linker_flags[:frameworks] << framework_name
        end
        index += 1
      when "-weak_framework"
        framework_name = tokens[index + 1]
        unless internal_framework_names.include?(framework_name)
          linker_flags[:weak_frameworks] << framework_name
        end
        index += 1
      end

      index += 1
    end
  end

  # React Native의 정적 xcframework에는 Objective-C++ 구현이 포함된다.
  # CocoaPods aggregate target의 OTHER_LDFLAGS에는 항상 노출되지 않으므로
  # SwiftPM 소비 패키지에서 C++ 표준 라이브러리를 명시적으로 연결한다.
  linker_flags[:libraries] << "c++"
  linker_flags[:frameworks].subtract(linker_flags[:weak_frameworks])
  linker_flags
end

# 분류한 linker flag를 사람이 읽기 쉬운 SwiftPM Package.swift 코드 문자열로 렌더링한다.
def render_linker_settings(linker_flags)
  sections = []

  if linker_flags[:unsafe_flags].any?
    lines = ["                  // 공통 linker flags"]
    linker_flags[:unsafe_flags].sort.each do |flag|
      lines << "                  .unsafeFlags([\"#{flag}\"]),"
    end
    sections << lines.join("\n")
  end

  if linker_flags[:libraries].any?
    lines = ["                  // 시스템 라이브러리"]
    linker_flags[:libraries].sort.each do |library|
      lines << "                  .linkedLibrary(\"#{library}\"),"
    end
    sections << lines.join("\n")
  end

  if linker_flags[:frameworks].any?
    lines = ["                  // iOS 시스템 프레임워크"]
    linker_flags[:frameworks].sort.each do |framework|
      lines << "                  .linkedFramework(\"#{framework}\", .when(platforms: [.iOS])),"
    end
    sections << lines.join("\n")
  end

  if linker_flags[:weak_frameworks].any?
    lines = ["                  // 약한 링크가 필요한 iOS 시스템 프레임워크"]
    linker_flags[:weak_frameworks].sort.each do |framework|
      lines << "                  .unsafeFlags([\"-weak_framework\", \"#{framework}\"], .when(platforms: [.iOS])),"
    end
    sections << lines.join("\n")
  end

  raise "No linker settings were derived from CocoaPods OTHER_LDFLAGS." if sections.empty?

  ["                  // CocoaPods aggregate target의 OTHER_LDFLAGS에서 시스템 링크 설정을 자동 추출한다.",
   sections.join("\n\n")].join("\n")
end

framework_names = load_framework_names(frameworks_dir)
linker_settings = render_linker_settings(
  load_linker_flags(xcconfig_paths, framework_names.to_set)
)

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
#{linker_settings}
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

File.write(package_swift_path, package_swift_content)
puts "Package.swift generated successfully!"
