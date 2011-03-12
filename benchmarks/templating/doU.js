// doU.js
// https://github.com/olado/doT
// doU is a slight modification of Underscore.js (http://documentcloud.github.com/underscore/) templating function.
// Main difference: avoided use of performance impacting with statement.
(function() {
	var doU = { version : '0.1.0' };

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = doU;
	} else {
		this.doU = doU;
	}

	doU.templateSettings = {
		evaluate : /\{\{([\s\S]+?)\}\}/g,
		interpolate : /\{\{=([\s\S]+?)\}\}/g,
		varname     : 'it'
	};

	doU.template = function(str, c) {
		c = c || doU.templateSettings;
		var	tmpl = "var out='';out+='" +
			str.replace(/\\/g, '\\\\')
				.replace(/'/g, "\\'")
				.replace(c.interpolate, function(match, code) {
					return "';out+=" + code.replace(/\\'/g, "'") + ";out+='";
				})
				.replace(c.evaluate || null, function(match, code) {
					return "';" + code.replace(/\\'/g, "'")
							  .replace(/[\r\n\t]/g, ' ') + "out+='";
				})
				.replace(/\r/g, '\\r')
				.replace(/\n/g, '\\n')
				.replace(/\t/g, '\\t')
				+ "';return out;";
		return new Function(c.varname, tmpl);
	};
}());
