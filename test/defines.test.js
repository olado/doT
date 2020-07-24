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
      testDef(
        "{{##def.tmp:foo:<div>{{=foo}}</div>#}}{{ var bar = it.foo; }}{{# def.tmp:bar }}"
      )
    })
  })

  function testDef(tmpl, defines) {
    const fn = doT.compile(tmpl, defines)
    assert.equal(fn({foo: "http"}), "<div>http</div>")
    assert.equal(fn({foo: "http://abc.com"}), "<div>http://abc.com</div>")
    assert.equal(fn({}), "<div>undefined</div>")
  }
})
