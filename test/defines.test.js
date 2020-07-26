"use strict"

const doT = require("..")
const assert = require("assert")

describe("defines", () => {
  describe("without parameters", () => {
    it("should render define", () => {
      testDef("{{##def.tmp:<div>{{=it.foo}}</div>#}}{{#def.tmp}}")
    })

    it("should render define if it is passed to doT.compile", () => {
      testDef("{{#def.tmp}}", {tmp: "<div>{{=it.foo}}</div>"})
    })
  })

  describe("with parameters", () => {
    it("should render define", () => {
      testDef("{{##def.tmp:foo:<div>{{=foo}}</div>#}}{{ var bar = it.foo; }}{{# def.tmp:bar }}")
    })

    it("should render define multiline params", () => {
      testDef(
        "{{##def.tmp:data:{{=data.openTag}}{{=data.foo}}{{=data.closeTag}}#}}\n" +
          "{{# def.tmp:{\n" +
          "   foo: it.foo,\n" +
          '   openTag: "<div>",\n' +
          '   closeTag: "</div>"\n' +
          "} }}"
      )
    })

    function compiledDefinesParamTemplate(param) {
      const tmpl = `{{##def.tmp:input:<div>{{=input.foo}}</div>#}}{{#def.tmp:${param}}}`
      return doT.template(tmpl)
    }

    it("should render define with standard parameter", () => {
      const definesParamCompiled = compiledDefinesParamTemplate("it")
      assert.equal(definesParamCompiled({foo: "A"}), "<div>A</div>")
      assert.equal(definesParamCompiled({}), "<div>undefined</div>")
    })

    it("should render define with property parameter", () => {
      const definesParamCompiled = compiledDefinesParamTemplate("it.bar")
      assert.equal(definesParamCompiled({bar: {foo: "B"}}), "<div>B</div>")
      assert.throws(() => {
        definesParamCompiled({})
      }, /TypeError: Cannot read property 'foo' of undefined/)
    })

    it("should render define with square bracket property parameter", () => {
      const definesParamCompiled = compiledDefinesParamTemplate("it['bar']")
      assert.equal(definesParamCompiled({bar: {foo: "C"}}), "<div>C</div>")
      assert.throws(() => {
        definesParamCompiled({})
      }, /TypeError: Cannot read property 'foo' of undefined/)
    })

    it("should render define with square bracket property with space parameter", () => {
      const definesParamCompiled = compiledDefinesParamTemplate("it['bar baz']")
      assert.equal(definesParamCompiled({"bar baz": {foo: "D"}}), "<div>D</div>")
      assert.throws(() => {
        definesParamCompiled({})
      }, /TypeError: Cannot read property 'foo' of undefined/)
    })

    it("should render define with array index property parameter", () => {
      const definesParamCompiled = compiledDefinesParamTemplate("it[1]")
      assert.equal(definesParamCompiled(["not this", {foo: "E"}, "not this"]), "<div>E</div>")
      assert.throws(() => {
        definesParamCompiled({})
      }, /TypeError: Cannot read property 'foo' of undefined/)
    })

    it("should render define with deep properties parameter", () => {
      const definesParamCompiled = compiledDefinesParamTemplate("it['bar baz'].qux[1]")
      assert.equal(
        definesParamCompiled({"bar baz": {qux: ["not this", {foo: "F"}, "not this"]}}),
        "<div>F</div>"
      )
      assert.throws(() => {
        definesParamCompiled({})
      }, /TypeError: Cannot read property 'qux' of undefined/)
    })
  })

  function testDef(tmpl, defines) {
    const fn = doT.compile(tmpl, defines)
    assert.equal(fn({foo: "http"}), "<div>http</div>")
    assert.equal(fn({foo: "http://abc.com"}), "<div>http://abc.com</div>")
    assert.equal(fn({}), "<div>undefined</div>")
  }
})
