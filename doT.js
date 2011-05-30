// doT.js
// 2011, Laura Doktorova
// https://github.com/olado/doT
//
// doT is a custom blend of templating functions from jQote2.js
// (jQuery plugin) by aefxx (http://aefxx.com/jquery-plugins/jqote2/)
// and underscore.js (http://documentcloud.github.com/underscore/)
// plus extensions.
//
// Licensed under the MIT license.
//
(function() {
	var doT = { version : '0.1.4' };

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = doT;
	} else {
		this.doT = doT;
	}

	doT.templateSettings = {
		evaluate:    /\{\{([\s\S]+?)\}\}/g,
		interpolate: /\{\{=([\s\S]+?)\}\}/g,
		encode:      /\{\{!([\s\S]+?)\}\}/g,
		use:         /\{\{#([\s\S]+?)\}\}/g, //compile time evaluation
		define:      /\{\{#\s*([\w$]+)\s*\:([\s\S]+?)#\}\}/g, //compile time defs
		varname: 'it',
		strip : true,
		append: true
	};

	function resolveDefs(define, use, str, defs) {
		return str.replace(define, function (match, code, value) {
				if (!(code in defs)) defs[code]=value;
				return '';
			})
			.replace(use, function(match, code) {
				var value;// todo: detect circular use and convert into compiled functions
				with(defs) {try { value = eval(code);} catch(e) { value='';} }
				return value ? resolveDefs(define, use, value.toString(), defs) : value;
			});
	}

	doT.template = function(tmpl, c, defs) {
		c = c || doT.templateSettings;
		var cstart = c.append ? "'+(" : "';out+=(",// optimal choice depends on platform/size of templates
		    cend   = c.append ? ")+'" : ");out+='";
		var str = (c.use || c.define) ? resolveDefs(c.define, c.use, tmpl, defs || {}) : tmpl;

		str = ("var out='" +
				((c.strip) ? str.replace(/\s*<!\[CDATA\[\s*|\s*\]\]>\s*|[\r\n\t]|(\/\*[\s\S]*?\*\/)/g, ''): str)
				.replace(/\\/g, '\\\\')
				.replace(/'/g, "\\'")
				.replace(c.interpolate, function(match, code) {
					return cstart + code.replace(/\\'/g, "'").replace(/\\\\/g,"\\").replace(/[\r\t\n]/g, ' ') + cend;
				})
				.replace(c.encode, function(match, code) {
					return cstart + code.replace(/\\'/g, "'").replace(/\\\\/g, "\\").replace(/[\r\t\n]/g, ' ') + ").toString().replace(/&(?!\\w+;)/g, '&#38;').split('<').join('&#60;').split('>').join('&#62;').split('" + '"' + "').join('&#34;').split(" + '"' + "'" + '"' + ").join('&#39;').split('/').join('&#x2F;'" + cend;
				})
				.replace(c.evaluate, function(match, code) {
					return "';" + code.replace(/\\'/g, "'").replace(/\\\\/g,"\\").replace(/[\r\t\n]/g, ' ') + "out+='";
				})
				+ "';return out;")
				.replace(/\n/g, '\\n')
				.replace(/\t/g, '\\t')
				.replace(/\r/g, '\\r')
				.split("out+='';").join('')
				.split('var out="";out+=').join('var out=');

		try {
			return new Function(c.varname, str);
		} catch (e) {
			if (typeof console !== 'undefined') console.log("Could not create a template function: " + str);
			throw e;
		}
	};
}());
