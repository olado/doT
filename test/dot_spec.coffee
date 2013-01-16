assert  = require 'assert'
doT     = require '../doT'
global.doT = doT

describe "doT", ->
  describe "#template()", ->
    it "should return a function", ->
      assert.equal "function", typeof doT.template ''

  describe "#()", ->
    it "should render the template", ->
      str = "<div>{{!it.foo || ''}}</div>"
      tmpl = doT.template str
      assert.equal "<div>http</div>", tmpl foo: "http"
      assert.equal "<div>http:&#47;&#47;abc.com</div>", tmpl foo: "http://abc.com"
      assert.equal "<div></div>", tmpl {}

  describe "defines", ->
    it "should render define", ->
      str = "{{##def.tmp:<div>{{!it.foo || ''}}</div>#}}{{#def.tmp}}"
      tmpl = doT.template str
      assert.equal "<div>http</div>", tmpl foo: "http"
      assert.equal "<div>http:&#47;&#47;abc.com</div>", tmpl foo: "http://abc.com"
      assert.equal "<div></div>", tmpl {}

  describe 'cached', ->
    include1 = '_dynamic': 'content': 'name': 'body1'
    include2 = '_dynamic': 'content': 'name': 'body2'

    beforeEach ->
      doT.autoload = doT.autoloadFail
      doT.addCached 'layout1', doT.compile '<html>{{@@content(it)}}</html>'
      doT.addCached 'layout2', doT.compile '<xml>{{@@content(it)}}</xml>'
      doT.addCached 'body1', doT.compile 'data1'
      doT.addCached 'body2', doT.compile 'data2 {{@partial(it)}}'
      doT.addCached 'partial', doT.compile 'partial'

    it "should render partial", ->
      assert.equal 'data2 partial', doT.render 'body2', {}

    it "should render using dynamic includes", ->
      assert.equal '<html>data1</html>', doT.render 'layout1', include1
      assert.equal '<html>data2 partial</html>', doT.render 'layout1', include2
      assert.equal '<xml>data1</xml>', doT.render 'layout2', include1
      assert.equal '<xml>data2 partial</xml>', doT.render 'layout2', include2

  describe 'content_for', ->
    it 'returns map', ->
      assert.deepEqual {_content: 'content end', title: 'title', footer: 'footer'},
        doT.compile('{{>title}}{{=val2}}{{>}}{{=val1}}{{>footer}}{{=val3}}{{>}}{{? false}}{{?}} end')(
          val1: 'content', val2: 'title', val3: 'footer'
        )
