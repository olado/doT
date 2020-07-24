"use strict"

const test = require("./util").test

describe("conditionals", () => {
  describe("without else", () => {
    const templates = [
      "{{?it.one < 2}}{{=it.one}}{{?}}{{=it.two}}",
      "{{? it.one < 2 }}{{= it.one }}{{?}}{{= it.two }}",
    ]

    it("should evaluate condition and include template if valid", () => {
      test(templates, {one: 1, two: 2}, "12")
    })

    it("should evaluate condition and do NOT include template if invalid", () => {
      test(templates, {one: 3, two: 2}, "2")
    })
  })

  describe("with else", () => {
    const templates = [
      "{{?it.one < 2}}{{=it.one}}{{??}}{{=it.two}}{{?}}",
      "{{? it.one < 2 }}{{= it.one }}{{??}}{{= it.two }}{{?}}",
    ]

    it('should evaluate condition and include "if" template if valid', () => {
      test(templates, {one: 1, two: 2}, "1")
    })

    it('should evaluate condition and include "else" template if invalid', () => {
      test(templates, {one: 3, two: 2}, "2")
    })
  })

  describe("with else if", () => {
    const templates = [
      "{{?it.one < 2}}{{=it.one}}{{??it.two < 3}}{{=it.two}}{{??}}{{=it.three}}{{?}}",
      "{{? it.one < 2 }}{{= it.one }}{{?? it.two < 3 }}{{= it.two }}{{??}}{{= it.three }}{{?}}",
    ]

    it('should evaluate condition and include "if" template if valid', () => {
      test(templates, {one: 1, two: 2, three: 3}, "1")
    })

    it('should evaluate condition and include "else if" template if second condition valid', () => {
      test(templates, {one: 10, two: 2, three: 3}, "2")
    })

    it('should evaluate condition and include "else" template if invalid', () => {
      test(templates, {one: 10, two: 20, three: 3}, "3")
    })
  })
})
