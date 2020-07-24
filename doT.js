// doT.js
// 2011-2014, Laura Doktorova, https://github.com/olado/doT
// Licensed under the MIT license.

const doT = module.exports = {
  templateSettings: {
    argName: "it",
    internalPrefix: "val",
    strip: true,
  },
  template,
  compile
}

const SYN = {
  evaluate: /\{\{([\s\S]+?(\}?)+)\}\}/g,
  interpolate: /\{\{=([\s\S]+?)\}\}/g,
  typeInterpolate: /\{\{%([nsb])=([\s\S]+?)\}\}/g,
  use: /\{\{#([\s\S]+?)\}\}/g,
  useParams: /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
  define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
  defineParams: /^\s*([\w$]+):([\s\S]+)/,
  conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
  iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
}

const TYPES = {
  n: "number",
  s: "string",
  b: "boolean",
}

function resolveDefs(c, block, def) {
  return ((typeof block === "string") ? block : block.toString())
  .replace(SYN.define, (_, code, assign, value) => {
    if (code.indexOf("def.") === 0) {
      code = code.substring(4)
    }
    if (!(code in def)) {
      if (assign === ":") {
        value.replace(SYN.defineParams, (_, param, v) => {
          def[code] = {arg: param, text: v}
        })
        if (!(code in def)) def[code]= value
      } else {
        new Function("def", `def['${code}']=${value}`)(def)
      }
    }
    return ""
  })
  .replace(SYN.use, (_, code) => {
    code = code.replace(SYN.useParams, (_, s, d, param) => {
      if (def[d] && def[d].arg && param) {
        const rw = (d+":"+param).replace(/'|\\/g, "_")
        def.__exp = def.__exp || {}
        def.__exp[rw] = def[d].text.replace(new RegExp(`(^|[^\\w$])${def[d].arg}([^\\w$])`, "g"), `$1${param}$2`);
        return s + `def.__exp['${rw}']`
      }
    })
    const v = new Function("def", "return " + code)(def)
    return v ? resolveDefs(c, v, def) : v
  });
}

function unescape(code) {
  return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ")
}

function template(tmpl, c, def) {
  c = c || doT.templateSettings
  let sid = 0
  let str  = resolveDefs(c, tmpl, def || {})

  str =
    ( "var out='" +
      ( c.strip
        ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g," ")
            .replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,"")
        : str
      ) .replace(/'|\\/g, "\\$&")
        .replace(SYN.interpolate, (_, code) => `'+(${unescape(code)})+'`)
        .replace(SYN.typeInterpolate, (_, typ, code) => {
          sid++
          const val = c.internalPrefix + sid
          const error = `throw new Error("expected ${TYPES[typ]}, got "+ (typeof ${val}))`
          return `';const ${val}=(${unescape(code)});if(typeof ${val}!="${TYPES[typ]}") ${error};out+=${val}+'`
        })
        .replace(SYN.conditional, (_, elseCase, code) =>
          elseCase
            ? (code ? `';}else if(${unescape(code)}){out+='` : "';}else{out+='")
            : (code ? `';if(${unescape(code)}){out+='` : "';}out+='"))
        .replace(SYN.iterate, (_, arr, vName, iName) => {
          if (!arr) return "';} } out+='"
          sid++
          const defI = iName ? `let ${iName}=-1;` : ""
          const incI = iName ? `${iName}++;` : ""
          const val = c.internalPrefix + sid
          return `';const ${val}=${unescape(arr)};if(${val}){${defI}for (const ${vName} of ${val}){${incI}out+='`
        })
        .replace(SYN.evaluate, (_, code) => `';${unescape(code)}out+='`)
      + "';return out;"
    )
    .replace(/\n/g, "\\n").replace(/\t/g, '\\t').replace(/\r/g, "\\r")
    .replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, "")

  try {
    return new Function(c.argName, str)
  } catch (e) {
    console.log("Could not create a template function: " + str)
    throw e
  }
}

function compile(tmpl, def) {
  return template(tmpl, null, def)
}
