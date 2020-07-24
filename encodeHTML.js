"use strict"

const encodeHTMLRules = {
  "&": "&#38;",
  "<": "&#60;",
  ">": "&#62;",
  '"': "&#34;",
  "'": "&#39;",
  "/": "&#47;",
}

const matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g

module.exports = function encodeHtml(s) {
  return typeof s === "string" ? s.replace(matchHTML, (m) => encodeHTMLRules[m] || m) : ""
}
