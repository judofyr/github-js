task :build do
  mkdir_p 'build'
  sh "ruby vendor/jsmin.rb < src/github.js > build/github.only.js"
  sh "cat vendor/jsclass/class.js src/github.js | ruby vendor/jsmin.rb > build/github.js"
end