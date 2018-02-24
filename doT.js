// doT.js
// 2011-2014, Laura Doktorova, https://github.com/olado/doT
// Licensed under the MIT license.

(function (global, factory) {
  var doT = factory(global);
  /* istanbul ignore else */
  if (typeof module !== "undefined" && module.exports) {
    module.exports = doT;
  } else if (typeof define === "function" && define.amd) {
    define(function () { return doT; });
  } else {
    global.doT = doT;
  }
}("undefined" !== typeof global ? global : this, function (global) {

  "use strict";

  /**
   * ===========================================================================
   *  Variables
   * ===========================================================================
   */
  var doT = {
    name: "doT",
    version: "1.1.1",
    templateSettings: {
      evaluate:         /\{\{([\s\S]+?(\}?)+)\}\}/g,
      interpolate:      /\{\{=([\s\S]+?)\}\}/g,
      encode:           /\{\{!([\s\S]+?)\}\}/g,
      use:              /\{\{#([\s\S]+?)\}\}/g,
      useParams:        /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
      define:           /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
      defineParams:     /^\s*([\w$]+):([\s\S]+)/,
      conditional:      /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
      iterate:          /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
      varname:          "it",
      strip:            true,
      append:           true,
      selfcontained:    false,
      doNotSkipEncoded: false
    },
    template: undefined, // fn, compile template
    compile:  undefined, // fn, for express
    log:      true
  };

  /**
   * ===========================================================================
   *  API Functions
   * ===========================================================================
   */

  /**
   * Encode HTML Source
   * @param  {Boolean} doNotSkipEncoded - whether do not skip encode
   * @return {Function}                 - encodeHTML()
   */
  doT.encodeHTMLSource = function (doNotSkipEncoded) {
    var encodeHTMLRules = {
      "&": "&#38;",
      "<": "&#60;",
      ">": "&#62;",
      '"': "&#34;",
      "'": "&#39;",
      "/": "&#47;"
    };
    var matchHTML = doNotSkipEncoded
                  ? /[&<>"'\/]/g
                  : /&(?!#?\w+;)|<|>|"|'|\//g;
    return function (code) {
      if (!code) { return ""; }
      return code.toString().replace(matchHTML, function (match) {
        return encodeHTMLRules[match] || match;
      });
    };
  };

  /**
   * @param  {String} tmpl - template text
   * @param  {Object} conf - custom compilation settings
   * @param  {Object} def  - defines for compile time evaluation
   * @return {Function}    - template function
   */
  doT.template = function (tmpl, conf, def) {
    conf = conf || doT.templateSettings;
    var wipTmpl = tmpl;
    if (conf.define || conf.use) {
      wipTmpl = resolveDefine(wipTmpl, conf, def || {});
    }
    if (conf.strip) {
      wipTmpl = resolveStrip(wipTmpl);
    }
    var needEncode = conf.encode && conf.encode.test(wipTmpl);
    var funcBody = resolveTemplate(wipTmpl, conf);
    if (needEncode) {
      if (!conf.selfcontained && global && !global._encodeHTML) {
        global._encodeHTML = doT.encodeHTMLSource(conf.doNotSkipEncoded);
      }
      funcBody = "var encodeHTML = 'undefined' !== typeof _encodeHTML ? _encodeHTML : ("
               + doT.encodeHTMLSource.toString() + "(" + (conf.doNotSkipEncoded || '') + "));"
               + funcBody;
    }
    try {
      return new Function(conf.varname, funcBody);
    } catch (exception) {
      /* istanbul ignore else */
      if ("undefined" !== typeof console) {
        console.log("Could not create a template function: " + funcBody);
      }
      throw exception;
    }
  };

  /**
   * @param  {String} tmpl - template
   * @param  {Object} def  - defines
   * @return {Function}    - template function
   */
  doT.compile = function (tmpl, def) {
    return doT.template(tmpl, null, def);
  };

  /**
   * ===========================================================================
   *  Core Functions
   * ===========================================================================
   */
  var _skip = /$^/;

  /**
   * Resolve Template String to Funcion String
   * @param  {String} tmpl - template work in process
   * @param  {Object} conf - config
   * @return {String}      - template function body
   */
  function resolveTemplate (tmpl, conf) {
    var startend = {
      append: { start: "'+(",      end: ")+'",      startEncode: "'+encodeHTML(" },
      split:  { start: "';out+=(", end: ");out+='", startEncode: "';out+=encodeHTML(" }
    };
    conf.startend = conf.append ? startend.append : startend.split;
    var funcBody = "var out = '" + tmpl.replace(/'|\\/g, "\\$&");
    funcBody = resolveInterpolate(funcBody, conf);
    funcBody = resolveEncode(funcBody, conf);
    funcBody = resolveConditional(funcBody, conf);
    funcBody = resolveIterate(funcBody, conf);
    funcBody = resolveEvaluate(funcBody, conf);
    funcBody = resolveMisc(funcBody);
    funcBody = funcBody + "'; return out;";
    return funcBody;
  }

  /**
   * @param  {String} tmpl - template before process
   * @param  {Object} conf - config
   * @return {String}      - template after process
   */
  function resolveInterpolate (tmpl, conf) {
    return tmpl.replace(conf.interpolate || _skip, function (match, code) {
      return conf.startend.start + unescape(code) + conf.startend.end;
    });
  }

  /**
   * @param  {String} tmpl - template before process
   * @param  {Object} conf - config
   * @return {String}      - template after process
   */
  function resolveEncode (tmpl, conf) {
    return tmpl.replace(conf.encode || _skip, function (match, code) {
      return conf.startend.startEncode + unescape(code) + conf.startend.end;
    });
  }

  /**
   * @param  {String} tmpl - template before process
   * @param  {Object} conf - config
   * @return {String}      - template after process
   */
  function resolveConditional (tmpl, conf) {
    return tmpl.replace(conf.conditional || _skip, function (match, elsecase, code) {
      return code ? (!elsecase ? "'; if (" + unescape(code) + ") { out += '"
                               : "'; } else if (" + unescape(code) + ") { out += '")
                  : ( elsecase ? "'; } else { out += '"
                               : "'; } out += '");
    });
  }

  /**
   * @param  {String} tmpl - template before process
   * @param  {Object} conf - config
   * @return {String}      - template after process
   */
  function resolveIterate (tmpl, conf) {
    var sid = 0;
    return tmpl.replace(conf.iterate || _skip, function (match, arr, v, i) {
      if (arr) {
        sid += 1;
        i = i || "i"+sid;
        return "';"
          + "var arr"+sid+" = "+ unescape(arr) +";"
          + "if (arr"+sid+") {"
          +   "var "+v+", "+i+" = -1, l"+sid+" = arr"+sid+".length - 1;"
          +   "while ("+i+" < l"+sid+") {"
          +     v+" = arr"+sid+"["+i+" += 1];"
          +     "out += '";
      }
      return   "';"
          +   "}"
          + "}"
          + "out += '";
    });
  }

  /**
   * @param  {String} tmpl - template before process
   * @param  {Object} conf - config
   * @return {String}      - template after process
   */
  function resolveEvaluate (tmpl, conf) {
    return tmpl.replace(conf.evaluate || _skip, function (match, code) {
      return "'; " + unescape(code) + "; out += '";
    });
  }

  /**
   * @param  {String} tmpl - template before process
   * @param  {Object} conf - config
   * @return {String}      - template after process
   */
  function resolveDefine (tmpl, conf, def) {
    if ("string" !== typeof tmpl) {
      tmpl = tmpl.toString();
    }
    tmpl = tmpl.replace(conf.define || _skip, function (match, defname, assign, value) {
      if (0 === defname.indexOf("def.")) {
        defname = defname.substring(4);
      }
      if (!(defname in def)) {
        if (":" === assign) {
          if (conf.defineParams) {
              value.replace(conf.defineParams, function (match, varname, subTmpl) {
              def[defname] = { varname: varname, tmpl: subTmpl };
            });
          }
          if (!(defname in def)) {
            def[defname] = value;
          }
        } else {
          new Function("def", "def['"+defname+"'] = " + value)(def);
        }
      }
      return "";
    });
    tmpl = tmpl.replace(conf.use || _skip, function (match, code) {
      if (conf.useParams) {
        code = code.replace(conf.useParams, function (match, operator, defname, param) {
          if (def[defname] && def[defname].varname && param) {
            var key = (defname+":"+param).replace(/'|\\/g, "_");
            var reg = "(^|[^\\w$])" + def[defname].varname + "([^\\w$])";
            def.__exp = def.__exp || {};
            def.__exp[key] = def[defname].tmpl.replace(new RegExp(reg, "g"), "$1"+param+"$2");
            return operator + "def.__exp['"+key+"']";
          }
        });
      }
      var block = new Function("def", "return " + code)(def);
      return block ? resolveDefine(block, conf, def) : block;
    });
    return tmpl;
  }

  /**
   * @param  {String} tmpl - template before process
   * @return {String}      - template after process
   */
  function resolveStrip (tmpl) {
    return tmpl.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g, " ")
               .replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g, "");
  }

  /**
   * @param  {String} tmpl - template before process
   * @return {String}      - template after process
   */
  function resolveMisc (tmpl) {
    return tmpl.replace(/\n/g, "\\n").replace(/\t/g, '\\t').replace(/\r/g, "\\r")
               .replace(/(\s|;|\}|^|\{)out\+='';/g, '$1').replace(/\+''/g, "");
               // .replace(/(\s|;|\}|^|\{)out\+=''\+/g,'$1out+=');
  }

  /**
   * ===========================================================================
   *  Util Functions
   * ===========================================================================
   */

  /**
   * @param  {String} code - template code string
   * @return {String}      - unescap string
   */
  function unescape (code) {
    return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, " ");
  }

  /**
   * ===========================================================================
   *  Exports
   * ===========================================================================
   */
  return doT;

}));
