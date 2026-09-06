Pod::Spec.new do |s|
  s.name = 'BeautyHQHealth'
  s.version = '1.0.0'
  s.summary = 'User-authorized HealthKit step import for BeautyHQ'
  s.description = 'Reads step samples only after native HealthKit authorization.'
  s.license = { :type => 'MIT' }
  s.author = 'BeautyHQ'
  s.homepage = 'https://beautyhq.io'
  s.platforms = { :ios => '14.0' }
  s.source = { :git => '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.frameworks = 'HealthKit'
  s.source_files = '**/*.{h,m,mm,swift}'
  s.swift_version = '5.4'
end
