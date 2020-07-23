// doT.js
// 2011-2014, Laura Doktorova, https://github.com/olado/doT
// Licensed under the MIT license.

var doT = {
  name: "doT",
  version: "1.1.1",
  templateSettings: {
    varname:	"it",
    strip:		true
  },
  template: undefined, //fn, compile template
  compile:  undefined, //fn, for express
  log: true
};

var syntax = {
  evaluate:    /\{\{([\s\S]+?(\}?)+)\}\}/g,
  interpolate: /\{\{=([\s\S]+?)\}\}/g,
  use:         /\{\{#([\s\S]+?)\}\}/g,
  useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
  define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
  defineParams:/^\s*([\w$]+):([\s\S]+)/,
  conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
  iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
};

module.exports = doT;

var skip = /$^/;

function resolveDefs(c, block, def) {
  return ((typeof block === "string") ? block : block.toString())
  .replace(syntax.define || skip, function(m, code, assign, value) {
    if (code.indexOf("def.") === 0) {
      code = code.substring(4);
    }
    if (!(code in def)) {
      if (assign === ":") {
        if (syntax.defineParams) value.replace(syntax.defineParams, function(m, param, v) {
          def[code] = {arg: param, text: v};
        });
        if (!(code in def)) def[code]= value;
      } else {
        new Function("def", "def['"+code+"']=" + value)(def);
      }
    }
    return "";
  })
  .replace(syntax.use, function(m, code) {
    if (syntax.useParams) code = code.replace(syntax.useParams, function(m, s, d, param) {
      if (def[d] && def[d].arg && param) {
        var rw = (d+":"+param).replace(/'|\\/g, "_");
        def.__exp = def.__exp || {};
        def.__exp[rw] = def[d].text.replace(new RegExp("(^|[^\\w$])" + def[d].arg + "([^\\w$])", "g"), "$1" + param + "$2");
        return s + "def.__exp['"+rw+"']";
      }
    });
    var v = new Function("def", "return " + code)(def);
    return v ? resolveDefs(c, v, def) : v;
  });
}

function unescape(code) {
  return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ");
}

doT.template = function(tmpl, c, def) {
  c = c || doT.templateSettings;
  var sid = 0, indv,
    str  = (syntax.use || syntax.define) ? resolveDefs(c, tmpl, def || {}) : tmpl;

  str = ("var out='" + (c.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g," ")
        .replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,""): str)
    .replace(/'|\\/g, "\\$&")
    .replace(syntax.interpolate, function(m, code) {
      return "'+(" + unescape(code) + ")+'";
    })
    .replace(syntax.conditional, function(m, elsecase, code) {
      return elsecase ?
        (code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
        (code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
    })
    .replace(syntax.iterate, function(m, iterate, vname, iname) {
      if (!iterate) return "';} } out+='";
      sid+=1; indv=iname || "i"+sid; iterate=unescape(iterate);
      return "';var arr"+sid+"="+iterate+";if(arr"+sid+"){var "+vname+","+indv+"=-1,l"+sid+"=arr"+sid+".length-1;while("+indv+"<l"+sid+"){"
        +vname+"=arr"+sid+"["+indv+"+=1];out+='";
    })
    .replace(syntax.evaluate, function(m, code) {
      return "';" + unescape(code) + "out+='";
    })
    + "';return out;")
    .replace(/\n/g, "\\n").replace(/\t/g, '\\t').replace(/\r/g, "\\r")
    .replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, "");

  try {
    return new Function(c.varname, str);
  } catch (e) {
    console.log("Could not create a template function: " + str);
    throw e;
  }
};

doT.compile = function(tmpl, def) {
  return doT.template(tmpl, null, def);
};
