"use strict"

// doT.js
// 2011-2014, Laura Doktorova, https://github.com/olado/doT
// Licensed under the MIT license.

const doT = {
  templateSettings: {
    argName: "it",
    encoders: {},
    selfContained: false,
    strip: true,
    internalPrefix: "_val",
    encodersPrefix: "_enc",
    delimiters: {
      start: "{{",
      end: "}}",
    },
  },
  template,
  compile,
  setDelimiters,
}

module.exports = doT

// depends on selfContained mode
const encoderType = {
  false: "function",
  true: "string",
}

const defaultSyntax = {
  evaluate: /\{\{([\s\S]+?(\}?)+)\}\}/g,
  interpolate: /\{\{=([\s\S]+?)\}\}/g,
  typeInterpolate: /\{\{%([nsb])=([\s\S]+?)\}\}/g,
  encode: /\{\{([a-z_$]+[\w$]*)?!([\s\S]+?)\}\}/g,
  use: /\{\{#([\s\S]+?)\}\}/g,
  useParams: /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$]+(?:\.[\w$]+|\[[^\]]+\])*|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
  define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
  defineParams: /^\s*([\w$]+):([\s\S]+)/,
  conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
  iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
}

let currentSyntax = {...defaultSyntax}

const TYPES = {
  n: "number",
  s: "string",
  b: "boolean",
}

function resolveDefs(c, syn, block, def) {
  return (typeof block === "string" ? block : block.toString())
    .replace(syn.define, (_, code, assign, value) => {
      if (code.indexOf("def.") === 0) {
        code = code.substring(4)
      }
      if (!(code in def)) {
        if (assign === ":") {
          value.replace(syn.defineParams, (_, param, v) => {
            def[code] = {arg: param, text: v}
          })
          if (!(code in def)) def[code] = value
        } else {
          new Function("def", `def['${code}']=${value}`)(def)
        }
      }
      return ""
    })
    .replace(syn.use, (_, code) => {
      code = code.replace(syn.useParams, (_, s, d, param) => {
        if (def[d] && def[d].arg && param) {
          const rw = unescape((d + ":" + param).replace(/'|\\/g, "_"))
          def.__exp = def.__exp || {}
          def.__exp[rw] = def[d].text.replace(
            new RegExp(`(^|[^\\w$])${def[d].arg}([^\\w$])`, "g"),
            `$1${param}$2`
          )
          return s + `def.__exp['${rw}']`
        }
      })
      const v = new Function("def", "return " + code)(def)
      return v ? resolveDefs(c, syn, v, def) : v
    })
}

function unescape(code) {
  return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ")
}

function template(tmpl, c, def) {
  const ds = c && c.delimiters
  const syn = ds && !sameDelimiters(ds) ? getSyntax(ds) : currentSyntax
  c = c ? {...doT.templateSettings, ...c} : doT.templateSettings
  let sid = 0
  let str = resolveDefs(c, syn, tmpl, def || {})
  const needEncoders = {}

  str = (
    "let out='" +
    (c.strip
      ? str
          .trim()
          .replace(/[\t ]+(\r|\n)/g, "\n") // remove trailing spaces
          .replace(/(\r|\n)[\t ]+/g, " ") // leading spaces reduced to " "
          .replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g, "") // remove breaks, tabs and JS comments
      : str
    )
      .replace(/'|\\/g, "\\$&")
      .replace(syn.interpolate, (_, code) => `'+(${unescape(code)})+'`)
      .replace(syn.typeInterpolate, (_, typ, code) => {
        sid++
        const val = c.internalPrefix + sid
        const error = `throw new Error("expected ${TYPES[typ]}, got "+ (typeof ${val}))`
        return `';const ${val}=(${unescape(code)});if(typeof ${val}!=="${
          TYPES[typ]
        }") ${error};out+=${val}+'`
      })
      .replace(syn.encode, (_, enc = "", code) => {
        needEncoders[enc] = true
        code = unescape(code)
        const e = c.selfContained ? enc : enc ? "." + enc : '[""]'
        return `'+${c.encodersPrefix}${e}(${code})+'`
      })
      .replace(syn.conditional, (_, elseCase, code) => {
        if (code) {
          code = unescape(code)
          return elseCase ? `';}else if(${code}){out+='` : `';if(${code}){out+='`
        }
        return elseCase ? "';}else{out+='" : "';}out+='"
      })
      .replace(syn.iterate, (_, arr, vName, iName) => {
        if (!arr) return "';} } out+='"
        sid++
        const defI = iName ? `let ${iName}=-1;` : ""
        const incI = iName ? `${iName}++;` : ""
        const val = c.internalPrefix + sid
        return `';const ${val}=${unescape(
          arr
        )};if(${val}){${defI}for (const ${vName} of ${val}){${incI}out+='`
      })
      .replace(syn.evaluate, (_, code) => `';${unescape(code)}out+='`) +
    "';return out;"
  )
    .replace(/\n/g, "\\n")
    .replace(/\t/g, "\\t")
    .replace(/\r/g, "\\r")
    .replace(/(\s|;|\}|^|\{)out\+='';/g, "$1")
    .replace(/\+''/g, "")

  const args = Array.isArray(c.argName) ? properties(c.argName) : c.argName

  if (Object.keys(needEncoders).length === 0) {
    return try_(() => new Function(args, str))
  }
  checkEncoders(c, needEncoders)
  str = `return function(${args}){${str}};`
  return try_(() =>
    c.selfContained
      ? new Function((str = addEncoders(c, needEncoders) + str))()
      : new Function(c.encodersPrefix, str)(c.encoders)
  )

  function try_(f) {
    try {
      return f()
    } catch (e) {
      console.log("Could not create a template function: " + str)
      throw e
    }
  }
}

function compile(tmpl, def) {
  return template(tmpl, null, def)
}

function sameDelimiters({start, end}) {
  const d = doT.templateSettings.delimiters
  return d.start === start && d.end === end
}

function setDelimiters(delimiters) {
  if (sameDelimiters(delimiters)) {
    console.log("delimiters did not change")
    return
  }
  currentSyntax = getSyntax(delimiters)
  doT.templateSettings.delimiters = delimiters
}

function getSyntax({start, end}) {
  start = escape(start)
  end = escape(end)
  const syntax = {}
  for (const syn in defaultSyntax) {
    const s = defaultSyntax[syn]
      .toString()
      .replace(/\\\{\\\{/g, start)
      .replace(/\\\}\\\}/g, end)
    syntax[syn] = strToRegExp(s)
  }
  return syntax
}

const escapeCharacters = /([{}[\]()<>\\\/^$\-.+*?!=|&:])/g

function escape(str) {
  return str.replace(escapeCharacters, "\\$1")
}

const regexpPattern = /^\/(.*)\/([\w]*)$/

function strToRegExp(str) {
  const [, rx, flags] = str.match(regexpPattern)
  return new RegExp(rx, flags)
}

function properties(args) {
  return args.reduce((s, a, i) => s + (i ? "," : "") + a, "{") + "}"
}

function checkEncoders(c, encoders) {
  const typ = encoderType[c.selfContained]
  for (const enc in encoders) {
    const e = c.encoders[enc]
    if (!e) throw new Error(`unknown encoder "${enc}"`)
    if (typeof e !== typ)
      throw new Error(`selfContained ${c.selfContained}: encoder type must be "${typ}"`)
  }
}

function addEncoders(c, encoders) {
  let s = ""
  for (const enc in encoders) s += `const ${c.encodersPrefix}${enc}=${c.encoders[enc]};`
  return s
}
