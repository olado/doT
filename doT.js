// doT.js
// 2011, Laura Doktorova
// https://github.com/olado/doT
//
// doT is a blend of templating functions from jQote2.js
// (jQuery plugin) by aefxx (http://aefxx.com/jquery-plugins/jqote2/)
// and underscore.js (http://documentcloud.github.com/underscore/)
//
// Licensed under the MIT license.
//
(function() {
	var doT = { version : '0.1.3' };

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = doT;
	} else {
		this.doT = doT;
	}

	doT.templateSettings = {
		evaluate : /\{\{([\s\S]+?)\}\}/g,
		interpolate : /\{\{=([\s\S]+?)\}\}/g,
		encode :  /\{\{!([\s\S]+?)\}\}/g,
		defines:  /\{\{#([\s\S]+?)\}\}/g,
		varname : 'it',
		strip : true
	};

	doT.template = function(tmpl, c, defs) {
		c = c || doT.templateSettings;
		var str = ("var out='" +
				((c.strip) ? tmpl.replace(/\s*<!\[CDATA\[\s*|\s*\]\]>\s*|[\r\n\t]|(\/\*[\s\S]*?\*\/)/g, ''):
							 tmpl)
				.replace(c.defines, function(match, code) {
					return eval(code.replace(/[\r\t\n]/g, ' '));
				})
				.replace(/\\/g, '\\\\')
				.replace(/'/g, "\\'")
				.replace(c.interpolate, function(match, code) {
					return "';out+=" + code.replace(/\\'/g, "'").replace(/\\\\/g,"\\").replace(/[\r\t\n]/g, ' ') + ";out+='";
				})
				.replace(c.encode, function(match, code) {
					return "';out+=(" + code.replace(/\\'/g, "'").replace(/\\\\/g, "\\").replace(/[\r\t\n]/g, ' ') + ").toString().replace(/&(?!\\w+;)/g, '&#38;').split('<').join('&#60;').split('>').join('&#62;').split('" + '"' + "').join('&#34;').split(" + '"' + "'" + '"' + ").join('&#39;').split('/').join('&#x2F;');out+='";
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
