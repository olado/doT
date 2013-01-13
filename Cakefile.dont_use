#! ./node_modules/.bin/cake run

{spawn, exec} = require 'child_process'

BIN = "#{__dirname}/node_modules/.bin/"

all = ->
  uglify()

uglify = ->
  compile()
  cmd = "#{BIN}uglifyjs -o #{__dirname}/doT.min.js #{__dirname}/doT.js"
  console.log(cmd)
  exec(cmd)

compile = ->
  cmd = "#{BIN}coffee -c -o #{__dirname} #{__dirname}/src"
  console.log(cmd)
  exec(cmd)

clean = ->
  cmd = "rm #{__dirname}/*.js"
  console.log(cmd)
  exec(cmd)

task('all', 'Build tasks', all)
task('uglify', 'Uglify scripts', uglify)
task('compile', 'Compile coffeescript', compile)
task('clean', 'Clean from compiled js', clean)
