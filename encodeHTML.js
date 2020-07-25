"use strict"
/* istanbul ignore file */

function getEncodeHtml() {
  const encodeHTMLRules = {
    "&": "&#38;",
    "<": "&#60;",
    ">": "&#62;",
    '"': "&#34;",
    "'": "&#39;",
    "/": "&#47;",
  }

  const matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g

  return function encodeHtml(s) {
    return typeof s === "string" ? s.replace(matchHTML, (m) => encodeHTMLRules[m] || m) : s
  }
}

module.exports = getEncodeHtml
