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
		var	tmpl = 'var __p=[],print=function(){__p.push.apply(__p,arguments);};' +
			'__p.push(\'' +
			str.replace(/\\/g, '\\\\')
				.replace(/'/g, "\\'")
				.replace(c.interpolate, function(match, code) {
					return "'," + code.replace(/\\'/g, "'") + ",'";
				})
				.replace(c.evaluate || null, function(match, code) {
					return "');" + code.replace(/\\'/g, "'")
							  .replace(/[\r\n\t]/g, ' ') + "__p.push('";
				})
				.replace(/\r/g, '\\r')
				.replace(/\n/g, '\\n')
				.replace(/\t/g, '\\t')
				+ "');return __p.join('');";
		return new Function(c.varname, tmpl);
	};
}());
