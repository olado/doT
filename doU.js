// doU.js
// https://github.com/olado/doT
//
// doU is a blend of underscore.js templating function (http://documentcloud.github.com/underscore/)
// and a templating function from jQote2.js (jQuery plugin) by aefxx (http://aefxx.com/jquery-plugins/jqote2/).
(function() {
	var doU = { version : '0.1.1' };

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = doU;
	} else {
		this.doU = doU;
	}

	doU.templateSettings = {
		evaluate : /\{\{([\s\S]+?)\}\}/g,
		interpolate : /\{\{=([\s\S]+?)\}\}/g,
		encode :  /\{\{!([\s\S]+?)\}\}/g,
		varname : 'it',
		shrink : true
	};

	doU.template = function(tmpl, c) {
		c = c || doU.templateSettings;
		var str = ("var out='" +
				((c.shrink) ? tmpl.replace(/\s*<!\[CDATA\[\s*|\s*\]\]>\s*|[\r\n\t]|(\/\*[\s\S]*?\*\/)/g, '') : tmpl)
			    .replace(/\\/g, '\\\\')
				.replace(/'/g, "\\'")
				.replace(c.interpolate, function(match, code) {
					return "';out+=" + code.replace(/\\'/g, "'").replace(/\\\\/g,"\\")  + ";out+='";
				})
				.replace(c.encode, function(match, code) {
					return "';out+=(" + code.replace(/\\'/g, "'").replace(/\\\\/g, "\\") + ").toString().replace(/&(?!\\w+;)/g, '&#38;').split('<').join('&#60;').split('>').join('&#62;').split('" + '"' + "').join('&#34;').split(" + '"' + "'" + '"' + ").join('&#39;');out+='";
				})
				.replace(c.evaluate, function(match, code) {
					return "';" + code.replace(/\\'/g, "'").replace(/\\\\/g,"\\") + "out+='";
				})
				+ "';return out;")
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
