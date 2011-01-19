// doT.js
// https://github.com/olado/doT
// doT is an extraction and slight modification of an excellent jQote2.js templating function (jQuery plugin) (http://aefxx.com/jquery-plugins/jqote2/).
// Modifications:
// 1. nodejs support
// 2. allow for custom template markers
// 3. only allow direct invocation of the compiled function
(function() {
	var doT = { version : '0.1.0' };

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = doT;
	} else {
		this.doT = doT;
	}

	doT.templateSettings = {
		begin : '{{',
		end : '}}',
		varname : 'it'
	};

	doT.template = function(tmpl, conf) {
		conf = conf || doT.templateSettings;
		var str = '', tb = conf.begin, te = conf.end, m, l,
			arr = tmpl.replace(/\s*<!\[CDATA\[\s*|\s*\]\]>\s*|[\r\n\t]|(\/\*[\s\S]*?\*\/)/g, '')
				.split(tb).join(te +'\x1b')
				.split(te);

		for (m=0,l=arr.length; m < l; m++) {
			str += arr[m].charAt(0) !== '\x1b' ?
			"out+='" + arr[m].replace(/(\\|["'])/g, '\\$1') + "'" : (arr[m].charAt(1) === '=' ?
			';out+=(' + arr[m].substr(2) + ');' : (arr[m].charAt(1) === '!' ?
			';out+=(' + arr[m].substr(2) + ").toString().replace(/&(?!\\w+;)/g, '&#38;').split('<').join('&#60;').split('>').join('&#62;').split('" + '"' + "').join('&#34;').split(" + '"' + "'" + '"' + ").join('&#39;');" : ';' + arr[m].substr(1)));
		}

		str = 'try{' +
			('var out="";'+str+';return out;')
			.split("out+='';").join('')
			.split('var out="";out+=').join('var out=') +
			'} catch(e){e.type="TemplateExecutionError";e.args=arguments;e.template=arguments.callee.toString();throw e;}';

		try {
			return new Function(conf.varname, str);
		} catch (e) {
			if (typeof console !== 'undefined') console.log("Could not create a template function: " + str);
			throw e;
		}
	};
}());
