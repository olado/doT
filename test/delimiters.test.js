"use strict"

const assert = require("assert")
const doT = require("..")

describe("custom delimiters", () => {
  describe("via config argument", () => {
    it("should replace delimiters for the current template only", () => {
      const tmplCustom = doT.template("<%= it.foo %>", {delimiters: {start: "<%", end: "%>"}})
      assert.equal(tmplCustom({foo: "bar"}), "bar")
      const tmpl = doT.template("{{= it.foo }}")
      assert.equal(tmpl({foo: "bar"}), "bar")
    })
  })

  describe("via global settings", () => {
    afterEach(() => {
      doT.setDelimiters({start: "{{", end: "}}"})
    })

    it("should replace delimiters for all templates", () => {
      doT.setDelimiters({start: "<%", end: "%>"})
      const tmpl = doT.template("<%= it.foo %>")
      assert.equal(tmpl({foo: "bar"}), "bar")
    })

    it("should be ok to pass the same delimiters", () => {
      doT.setDelimiters({start: "{{", end: "}}"})
      const tmpl = doT.template("{{= it.foo }}")
      assert.equal(tmpl({foo: "bar"}), "bar")
    })
  })
})
