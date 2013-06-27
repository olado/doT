assert  = require 'assert'
doT     = require '../do_t'

describe 'doT', ->
  describe '#compile', ->
    it 'returns a function', ->
      assert.equal 'function', typeof doT.compile ''

  describe 'calling compiled function', ->
    it 'renders the template', ->
      str = "<div>{{!it.foo || ''}}</div>"
      tmpl = doT.compile str
      assert.equal '<div>http</div>', tmpl foo: 'http'
      assert.equal '<div>http:&#47;&#47;abc.com</div>', tmpl foo: 'http://abc.com'
      assert.equal '<div></div>', tmpl {}

  context 'with caching', ->
    include1 = '_dynamic': 'content': 'name': 'body1'
    include2 = '_dynamic': 'content': 'name': 'body2'

    beforeEach ->
      doT.autoload = doT.autoloadFail
      doT.addCached 'layout1', doT.compile '<html>{{@@content(it)}}</html>'
      doT.addCached 'layout2', doT.compile '<xml>{{@@content(it)}}</xml>'
      doT.addCached 'body1', doT.compile 'data1'
      doT.addCached 'body2', doT.compile 'data2 {{@partial(it)}}'
      doT.addCached 'partial', doT.compile 'partial'

    it 'renders partial', ->
      assert.equal 'data2 partial', doT.render 'body2', {}

    it 'renders using dynamic includes', ->
      assert.equal '<html>data1</html>', doT.render 'layout1', include1
      assert.equal '<html>data2 partial</html>', doT.render 'layout1', include2
      assert.equal '<xml>data1</xml>', doT.render 'layout2', include1
      assert.equal '<xml>data2 partial</xml>', doT.render 'layout2', include2

    describe '#getCached', ->
      it 'returns template function', ->
        assert.equal 'data1', doT.getCached('body1') {}
      it 'returns object with template functions', ->
        assert.equal 'data1', doT.getCached().body1 {}

    describe '#setCached', ->
      it 'sets all cached functions', ->
        cache = doT.getCached()
        doT.setCached {}
        assert.throws -> doT.render 'body1', {}
        doT.setCached cache
        assert.equal 'data1', doT.render 'body1', {}

    describe '#exportCached', ->
      it 'exports js object with template functions', ->
        str = doT.exportCached()
        obj = null
        eval "obj = #{str}"
        assert.equal 'data1', obj.body1 {}

  context 'tag', ->
    describe '`content_for`', ->
      it 'returns map', ->
        assert.deepEqual {_content: 'content end', title: 'title', footer: 'footer'},
          doT.compile('{{>title}}{{=val2}}{{>}}{{=val1}}{{>footer}}{{=val3}}{{>}}{{? false}}{{?}} end')(
            val1: 'content', val2: 'title', val3: 'footer'
          )

    describe '`define`', ->
      it 'works', ->
        str = "{{##def.tmp:<div>{{!it.foo || ''}}</div>#}}{{#def.tmp}}"
        tmpl = doT.compile str
        assert.equal '<div>http</div>', tmpl foo: 'http'
        assert.equal '<div>http:&#47;&#47;abc.com</div>', tmpl foo: 'http://abc.com'
        assert.equal '<div></div>', tmpl {}

    describe '`interpolate`', ->
      it 'works without spaces', ->
        assert.equal 'a', doT.compile('{{=it}}') 'a'
      it 'works with some spaces', ->
        assert.equal 'b', doT.compile('{{ =it }}') 'b'
      it 'works with a lot spaces', ->
        assert.equal 'c', doT.compile('{{ = it }}') 'c'

    describe '`encode`', ->
      it 'works without spaces', ->
        assert.equal '<'.encodeHTML(), doT.compile('{{!it}}') '<'
      it 'works with some spaces', ->
        assert.equal '>'.encodeHTML(), doT.compile('{{ !it }}') '>'
      it 'works with a lot spaces', ->
        assert.equal '<<'.encodeHTML(), doT.compile('{{ ! it }}') '<<'

    describe 'conditional', ->
      it 'works without spaces', ->
        assert.equal 'a', doT.compile('{{?it}}a{{?}}') true
      it 'works with spaces', ->
        assert.equal 'b', doT.compile('{{ ? it }}b{{ ? }}') true
      it 'elsecase works', ->
        assert.equal 'c', doT.compile('{{ ?it }}a{{ ?? }}c{{?}}') false
      it 'else-elsecase works', ->
        assert.equal 'd', doT.compile('{{ ? it }}a{{ ?? false }}b{{ ?? }}d{{ ? }}') false
      it 'inverse condition works', ->
        assert.equal 'e', doT.compile('{{ ? !it }}e{{ ? }}') false

    describe 'iterate', ->
      it 'works without spaces & key', ->
        assert.equal 'abc', doT.compile('{{~it:x}}{{=x}}{{~}}') ['a','b','c']
      it 'works without spaces, with key', ->
        assert.equal '0a1b2c', doT.compile('{{~it:x=>y}}{{=x}}{{=y}}{{~}}') ['a','b','c']
      it 'works with spaces, without key', ->
        assert.equal 'abc', doT.compile('{{ ~ it : x }}{{=x}}{{ ~ }}') ['a','b','c']
      it 'works with spaces & key', ->
        assert.equal '0a1b2c', doT.compile('{{ ~ it : x => y }}{{=x}}{{=y}}{{ ~ }}') ['a','b','c']

    describe 'iterateFor', ->
      it 'works without spaces & key', ->
        assert.equal '123', doT.compile('{{:it:x}}{{=x}}{{:}}') a: 1, b: 2, c: 3
      it 'works without spaces, with key', ->
        assert.equal 'a1b2c3', doT.compile('{{:it:x=>y}}{{=x}}{{=y}}{{:}}') a: 1, b: 2, c: 3
      it 'works with spaces, without key', ->
        assert.equal '123', doT.compile('{{ : it : x }}{{=x}}{{ : }}') a: 1, b: 2, c: 3
      it 'works with spaces & key', ->
        assert.equal 'a1b2c3', doT.compile('{{ : it : x => y }}{{=x}}{{=y}}{{ : }}') a: 1, b: 2, c: 3
      it 'iterates through inline object', ->
        assert.equal 'test', doT.compile('{{:{x:"test"} :k => v}}{{=v}}{{:}}') {}
      it 'iterates through complex inline object but without spaces', ->
        assert.equal 'test', doT.compile('{{: {x:"test",y:{z:{}}} :k => v}}{{=v}}{{break}}{{:}}') {}

  describe 'tags combination', ->
    it 'works', ->
      assert.equal 'abcdef', doT.compile('{{
          =a }}{{
          !b }}{{
          ?true }}c{{?}}{{
          ~d:x}}{{=x}}{{~}}{{
          :e:x}}{{=x}}{{:}}{{
          var v = f}}{{=v}}') a: 'a', b: 'b', c: 'c', d: ['d'], e: {key: 'e'}, f: 'f'
