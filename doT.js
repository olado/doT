// doT.js
// 2011, Laura Doktorova, https://github.com/olado/doT
//
// doT.js is an open source component of http://bebedo.com
// Licensed under the MIT license.
//
(function() {
	"use strict";
	
	var startend = {
		append: { start: "'+(",      end: ")+'",      startencode: "'+doT.eh(" },
		split:  { start: "';out+=(", end: ");out+='", startencode: "';out+=doT.eh("}
	}
	
	var doT = {
		version: '0.2.0',
		templateSettings: {
			use:			/\{\{#([\s\S]+?)\}\}/g,
			define:			/\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
			varname:		'it',
			strip:			true,
			with:			true,
			dynamicList:	'it._dynamic',
			startend:		startend.append
		},
		startend:	startend,
		tags:		{},
		encodeHTML:	undefined, //escapes html strings
		eh:			undefined, //shortcut
		template:	undefined, //fn, compile template
		compile:	undefined, //fn, for express
		getCached:	undefined, //methods for cache managment
		setCached:	undefined,
		addCached:	undefined,
		render:		undefined, //render using cache
		autoload:	undefined, //autoloads template text
		autoloadDOM:	undefined, //some autoload implementations
		autoloadFS:	undefined
	};
	var cache	= {};
	var sid		= 0; // sequental id for variable names
	var skip	= /$^/;
	
	// tags definition
	var tags = doT.tags
	tags.interpolate = {
		regex: /\{\{=([\s\S]+?)\}\}/g,
		func: function(m, code) {
			var cse = doT.templateSettings.startend;
			return cse.start + unescape(code) + cse.end;
		}
	}
	tags.encode = {
		regex: /\{\{!([\s\S]+?)\}\}/g,
		func: function(m, code) {
			var cse = doT.templateSettings.startend;
			return cse.startencode + unescape(code) + cse.end;
		}
	}
	tags.conditional = {
		regex: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
		func: function(m, elsecase, code) {
			return elsecase ?
				(code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
				(code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
		}
	}
	tags.iterate = {
		regex: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
		func: function(m, iterate, vname, iname) {
			if (!iterate) return "';} } out+='";
			sid += 1;
			var indv = iname || "i" + sid;
			var iterate = unescape(iterate);
			return "';var arr" + sid + "=" + iterate + ";"
				+ "if(arr" + sid + "){var " + vname + ","
				+ indv + "=-1,l" + sid + "=arr" + sid + ".length-1;"
				+ "while(" + indv + "<l" + sid + "){"
				+ vname + "=arr" + sid + "[" + indv + "+=1];out+='";
		}
	}
	tags.iterateFor = {
		regex: /\{\{:\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
		func: function(m, iterate, vname, iname) {
			if (!iterate) return "';} } out+='";
			sid += 1;
			var inpname = "iter" + sid;
			return "';var " + inpname + "=" + iterate + ";"
				+ "if(" + inpname + "){var " + vname + "," + iname + ";"
				+ "for(" + iname + " in " + inpname + "){"
				+ vname+ "=" + inpname + "[" + iname + "];out+='";
		}
	}
	tags.xx_includeDynamic = {
		regex: /\{\{@@([\S]+?)\([\s]*([\s\S]*?)[\s]*\)\}\}/g,
		func: function(m, tmpl, args) {
			return "';var tmpl=" + doT.templateSettings.dynamicList + "['" + unescape(tmpl) + "'];"
				+ "out+=doT.render({name:tmpl.name, args:tmpl.args || arguments})+'"
		}
	}
	tags.xy_render = {
		regex: /\{\{@([\S]+?)\([\s]*([\s\S]*?)[\s]*\)\}\}/g,
		func: function(m, tmpl, args) {
			return "'+doT.render('" + tmpl + "'" + (args ? "," + unescape(args) : '') + ")+'"
		}
	}
	tags.zz_evaluate = {
		regex: /\{\{([\s\S]+?)\}\}/g,
		func: function(m, code) {
			return "';" + unescape(code) + ";out+='";
		}
	}

	// register in global scope
	var global = (function(){ return this || (0,eval)('this'); }());

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = doT;
	} else if (typeof define === 'function' && define.amd) {
		define(function(){return doT;});
	} else {
		global.doT = doT;
	}

	// helpers
	function encodeHTMLSource() {
		var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "/": '&#47;' },
			matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g;
		return function(code) {
			return code ? code.toString().replace(matchHTML, function(m) {return encodeHTMLRules[m] || m;}) : code;
		};
	}
	doT.encodeHTML = encodeHTMLSource();
	doT.eh = doT.encodeHTML;

	function unescape(code) {
		return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, ' ');
	}
	doT.unescape = unescape

	// template compilation
	function resolveDefs(c, block, def) {
		return ((typeof block === 'string') ? block : block.toString())
		.replace(c.define || skip, function(m, code, assign, value) {
			if (code.indexOf('def.') === 0) {
				code = code.substring(4);
			}
			if (!(code in def)) {
				if (assign === ':') {
					def[code]= value;
				} else {
					eval("def['"+code+"']=" + value);
				}
			}
			return '';
		})
		.replace(c.use || skip, function(m, code) {
			var v = eval(code);
			return v ? resolveDefs(c, v, def) : v;
		});
	}

	doT.template = function(tmpl, def) {
		var c = doT.templateSettings, str;

		if (c.use || c.define) {
			var olddef = global.def; global.def = def || {}; // workaround minifiers
			str = resolveDefs(c, tmpl, global.def);
			global.def = olddef;
		} else str = tmpl;
		
		str = (c.strip ?
				str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g,' ')
					.replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,'')
				: str)
			.replace(/'|\\/g, '\\$&')
		var taglist = Object.keys(doT.tags).sort()
		for ( var t_id in taglist )
			str = str.replace( doT.tags[ taglist[ t_id ] ].regex, doT.tags[ taglist[ t_id ] ].func )
		str = ("var out='" + str + "';return out;")
			.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
			.replace(/(\s|;|}|^|{)out\+='';/g, '$1').replace(/\+''/g, '')
			.replace(/(\s|;|}|^|{)out\+=''\+/g,'$1out+=');
		if(c.with)
			str = "with("+(true === c.with ? c.varname : c.with)+"){"+str+"}"
		try {
			return new Function(c.varname, str);
		} catch (e) {
			throw e + ' in ' + str;
		}
	};

	doT.compile = doT.template;
	
	// cache functions
	doT.getCached = function(){return cache};
	doT.exportCached = function()
	{
		var str = ""
		for (var id in cache)
			str+=',"'+id+'":'+cache[id].toString()
		return '{'+str.substring(1)+'}'
	}
	doT.setCached = function(fns){cache = fns};
	doT.addCached = function(id, fn)
	{
		if ('object' === typeof id)
		{
			for (i in id) doT.addCached(i,id[i]);
			return;
		}
		cache[id] = fn
	};
	
	// doT.render() for transparent autoloding & caching
	doT.render = function(tmpl)
	{
		('object' !== typeof tmpl) && (tmpl = { name: tmpl })
		if (!cache[tmpl.name])
		{
			var src = doT.autoload(tmpl.name)
			if (false === src)
				throw 'Template not found: ' + tmpl.name
			doT.addCached(tmpl.name, doT.compile(src))
		}
		return cache[tmpl.name].apply(this, tmpl.args || Array.prototype.slice.call(arguments, 1))
	};
	
	doT.autoloadDOM = function( opts )
	{
		return function( name )
		{
			var src = document.getElementById( name )
			if ( !src || !src.type || 'text/x-dot-tmpl' != src.type )
				return false
			return src.innerHTML
		}
	};
	
	doT.autoloadFS = function( opts )
	{
		return function( name )
		{
			try
			{
				return opts.fs.readFileSync(
					opts.root + '/' +  name.replace( '.', '/' ) + '.tmpl'
				)
			} catch (e) { return false }
		}
	};
	
	doT.autoload = doT.autoloadDOM();
}());
