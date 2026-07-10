require 'xcodeproj'

project = Xcodeproj::Project.new('ReactNativePrebuild.xcodeproj')
project.new_target(:application, 'ReactNativePrebuild', :ios)
project.save
