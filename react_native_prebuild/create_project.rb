require 'xcodeproj'

# 새로운 프로젝트 생성
project = Xcodeproj::Project.new('ReactNativePrebuild.xcodeproj')

# 타겟 추가
project.new_target(:application, 'ReactNativePrebuild', :ios)

# 프로젝트 저장
project.save
