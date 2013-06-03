assert  = require 'assert'
doT     = require '../doT'
compile = require '../compile'
global.doT    = doT
doT.autoload  = doT.autoloadFail

dir = require('fs').realpathSync __dirname

describe 'compile', ->
  beforeEach ->
    doT.setCached {}

  describe 'basic', ->
    it 'should invoke callback with err if there is no file', (done) ->
      compile files: ["#{dir}/tmpl/fail"], (err, data) ->
        assert.notEqual err, null
        done()

    it 'should invoke callback if empty fileset is given', (done) ->
      compile files: [], (err, data) ->
        assert.equal err, null
        done()

    it 'should invoke callback with if there is empty folder', (done) ->
      compile files: ["#{dir}/tmpl/empty"], (err, data) ->
        assert.equal err, null
        done()

    it 'should compile file', (done) ->
      compile files: ["#{dir}/tmpl/one.tmpl"], (err, data) ->
        assert.equal err, null
        assert.equal "one hi\n", doT.render 'one', val: 'hi'
        done()

    it 'should compile directory', (done) ->
      compile files: ["#{dir}/tmpl/dir"], (err, data) ->
        assert.equal err, null
        assert.equal "two hi\n", doT.render 'two', val: 'hi'
        done()

    it 'should use `base` parametr', (done) ->
      compile files: ["#{dir}/tmpl/dir"], base: "#{dir}/tmpl", (err, data) ->
        assert.equal err, null
        assert.equal "two hi\n", doT.render 'dir.two', val: 'hi'
        done()

  describe 'prefilters', ->
    describe 'haml', ->
      it 'should compile using haml', (done)->
        compile files: ["#{dir}/tmpl/haml"], (err, data) ->
          assert.equal err, null
          assert.equal "<html>hi</html>\n", doT.render 'test', val: 'hi'
          done()
