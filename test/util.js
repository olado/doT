"use strict"

const assert = require("assert")
const doT = require("../doT")

exports.test = function (templates, data, result) {
  templates.forEach((tmpl) => {
    const fn = doT.template(tmpl)
    assert.strictEqual(fn(data), result)
  })
}
