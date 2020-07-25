"use strict"

const test = require("./util").test
const assert = require("assert")

describe("iteration", () => {
  describe("without index", () => {
    it("should repeat string N times", () => {
      test(
        [
          "{{~it.arr:x}}*{{~}}",
          "{{~ it.arr:x }}*{{~}}",
          "{{~ it.arr: x }}*{{~}}",
          "{{~ it.arr :x }}*{{~}}",
        ],
        {arr: Array(3)},
        "***"
      )
    })

    it("should concatenate items", () => {
      test(["{{~it.arr:x}}{{=x}}{{~}}"], {arr: [1, 2, 3]}, "123")
    })
  })

  describe("with index", () => {
    it("should repeat string N times", () => {
      test(["{{~it.arr:x:i}}*{{~}}", "{{~ it.arr : x : i }}*{{~}}"], {arr: Array(3)}, "***")
    })

    it("should concatenate indices", () => {
      test(["{{~it.arr:x:i}}{{=i}}{{~}}"], {arr: Array(3)}, "012")
    })

    it("should concatenate indices and items", () => {
      test(
        ["{{~it.arr:x:i}}{{?i}}, {{?}}{{=i}}:{{=x}}{{~}}"],
        {arr: [10, 20, 30]},
        "0:10, 1:20, 2:30"
      )
    })

    it("should interpolate nested array even if the same index variable is used", () => {
      test(
        ["{{~it.arr:x:i}}{{~x:y:i}}{{=y}}{{~}}{{~}}"],
        {
          arr: [
            [1, 2, 3],
            [4, 5, 6],
          ],
        },
        "123456"
      )
    })
  })

  describe("iterables", () => {
    const set = new Set([1, 2, 3])

    describe("without index", () => {
      it("should repeat string N times", () => {
        assert.strictEqual(Array.isArray(set.values()), false)
        test(["{{~it.arr:x}}*{{~}}"], {arr: set.values()}, "***")
      })

      it("should concatenate items", () => {
        test(["{{~it.arr:x}}{{=x}}{{~}}"], {arr: set.values()}, "123")
      })
    })

    describe("with index", () => {
      it("should repeat string N times", () => {
        test(["{{~it.arr:x:i}}*{{~}}"], {arr: set.values()}, "***")
      })

      it("should concatenate indices", () => {
        test(["{{~it.arr:x:i}}{{=i}}{{~}}"], {arr: set.values()}, "012")
      })

      it("should concatenate indices and items", () => {
        test(
          ["{{~it.arr:x:i}}{{?i}}, {{?}}{{=i}}:{{=x}}{{~}}"],
          {arr: set.values()},
          "0:1, 1:2, 2:3"
        )
      })
    })
  })
})
