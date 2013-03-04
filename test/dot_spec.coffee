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

  describe 'syntax', ->
    describe 'interpolate tag', ->
      it 'without spaces', ->
        assert.equal 'a', doT.compile('{{=it}}') 'a'
      it 'with some spaces', ->
        assert.equal 'b', doT.compile('{{ =it }}') 'b'
      it  'with a lot spaces', ->
        assert.equal 'c', doT.compile('{{ = it }}') 'c'

    describe 'encode tag', ->
      it 'without spaces', ->
        assert.equal '<'.encodeHTML(), doT.compile('{{!it}}') '<'
      it 'with some spaces', ->
        assert.equal '>'.encodeHTML(), doT.compile('{{ !it }}') '>'
      it 'with a lot spaces', ->
        assert.equal '<<'.encodeHTML(), doT.compile('{{ ! it }}') '<<'

    describe 'conditional tag', ->
      it 'without spaces', ->
        assert.equal 'a', doT.compile('{{?it}}a{{?}}') true
      it 'with spaces', ->
        assert.equal 'b', doT.compile('{{ ? it }}b{{ ? }}') true
      it 'elsecase', ->
        assert.equal 'c', doT.compile('{{ ?it }}a{{ ?? }}c{{?}}') false
      it 'else-elsecase', ->
        assert.equal 'd', doT.compile('{{ ? it }}a{{ ?? false }}b{{ ?? }}d{{ ? }}') false

    describe 'iterate tag', ->
      it 'without spaces & key', ->
        assert.equal 'abc', doT.compile('{{~it:x}}{{=x}}{{~}}') ['a','b','c']
      it 'without spaces, with key', ->
        assert.equal '0a1b2c', doT.compile('{{~it:x=>y}}{{=x}}{{=y}}{{~}}') ['a','b','c']
      it 'with spaces, without key', ->
        assert.equal 'abc', doT.compile('{{ ~ it : x }}{{=x}}{{ ~ }}') ['a','b','c']
      it 'with spaces & key', ->
        assert.equal '0a1b2c', doT.compile('{{ ~ it : x => y }}{{=x}}{{=y}}{{ ~ }}') ['a','b','c']

    describe 'iterateFor tag', ->
      it 'without spaces & key', ->
        assert.equal '123', doT.compile('{{:it:x}}{{=x}}{{:}}') a: 1, b: 2, c: 3
      it 'without spaces, with key', ->
        assert.equal 'a1b2c3', doT.compile('{{:it:x=>y}}{{=x}}{{=y}}{{:}}') a: 1, b: 2, c: 3
      it 'with spaces, without key', ->
        assert.equal '123', doT.compile('{{ : it : x }}{{=x}}{{ : }}') a: 1, b: 2, c: 3
      it 'with spaces & key', ->
        assert.equal 'a1b2c3', doT.compile('{{ : it : x => y }}{{=x}}{{=y}}{{ : }}') a: 1, b: 2, c: 3

    it 'tags combination', ->
      assert.equal 'abcdef', doT.compile('{{
          =a }}{{
          !b }}{{
          ?true }}c{{?}}{{
          ~d:x}}{{=x}}{{~}}{{
          :e:x}}{{=x}}{{:}}{{
          var v = f}}{{=v}}') a: 'a', b: 'b', c: 'c', d: ['d'], e: {key: 'e'}, f: 'f'
