// doT.js
// 2011, Laura Doktorova, https://github.com/olado/doT
//
// doT.js is an open source component of http://bebedo.com
// Licensed under the MIT license.
//
(function() {
	"use strict";

	var doT = {
		version: '0.2.0',
		templateSettings: {
			evaluate:		/\{\{([\s\S]+?)\}\}/g,
			interpolate:	/\{\{=([\s\S]+?)\}\}/g,
			encode:			/\{\{!([\s\S]+?)\}\}/g,
			use:			/\{\{#([\s\S]+?)\}\}/g,
			define:			/\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
			conditional:	/\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
			iterate:		/\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
			iteratefor:		/\{\{:\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
			render:			/\{\{@([\S]+?)\([\s]*([\s\S]*?)[\s]*\)\}\}/g,
			varname: 'it',
			strip: true,
			append: true,
			with:	true
		},
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
	var cache = {};

	var global = (function(){ return this || (0,eval)('this'); }());

	if (typeof module !== 'undefined' && module.exports) {
		module.exports = doT;
	} else if (typeof define === 'function' && define.amd) {
		define(function(){return doT;});
	} else {
		global.doT = doT;
	}

	function encodeHTMLSource() {
		var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "/": '&#47;' },
			matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g;
		return function(code) {
			return code ? code.toString().replace(matchHTML, function(m) {return encodeHTMLRules[m] || m;}) : code;
		};
	}
	global.encodeHTML = encodeHTMLSource();

	var startend = {
		append: { start: "'+(",      end: ")+'",      startencode: "'+encodeHTML(" },
		split:  { start: "';out+=(", end: ");out+='", startencode: "';out+=encodeHTML("}
	}, skip = /$^/;

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

	function unescape(code) {
		return code.replace(/\\('|\\)/g, "$1").replace(/[\r\t\n]/g, ' ');
	}

	doT.template = function(tmpl, c, def) {
		c = c || doT.templateSettings;
		var cse = c.append ? startend.append : startend.split, str, sid=0, indv, inpname;

		if (c.use || c.define) {
			var olddef = global.def; global.def = def || {}; // workaround minifiers
			str = resolveDefs(c, tmpl, global.def);
			global.def = olddef;
		} else str = tmpl;

		str = ("var out='" + (c.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g,' ')
					.replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,''): str)
			.replace(/'|\\/g, '\\$&')
			.replace(c.interpolate || skip, function(m, code) {
				return cse.start + unescape(code) + cse.end;
			})
			.replace(c.encode || skip, function(m, code) {
				return cse.startencode + unescape(code) + cse.end;
			})
			.replace(c.conditional || skip, function(m, elsecase, code) {
				return elsecase ?
					(code ? "';}else if(" + unescape(code) + "){out+='" : "';}else{out+='") :
					(code ? "';if(" + unescape(code) + "){out+='" : "';}out+='");
			})
			.replace(c.iterate || skip, function(m, iterate, vname, iname) {
				if (!iterate) return "';} } out+='";
				sid+=1; indv=iname || "i"+sid; iterate=unescape(iterate);
				return "';var arr"+sid+"="+iterate+";if(arr"+sid+"){var "+vname+","
					+indv+"=-1,l"+sid+"=arr"+sid+".length-1;while("+indv+"<l"+sid+"){"
					+vname+"=arr"+sid+"["+indv+"+=1];out+='";
			})
			.replace(c.iteratefor || skip, function(m, iterate, vname, iname) {
				if (!iterate) return "';} } out+='";
				sid+=1;
				inpname = "iter"+sid;
				return "';var "+inpname+"="+iterate+";if("+inpname+"){var "+vname+","+iname+";"
					+"for("+iname+" in "+inpname+"){"
					+vname+"="+inpname+"["+iname+"];out+='";
			})
			.replace(c.render || skip, function(m, tmpl, args) {
				return "'+doT.render('"+tmpl+"'"+(args ? ","+unescape(args) : '')+")+'"
			})
			.replace(c.evaluate || skip, function(m, code) {
				return "';" + unescape(code) + ";out+='";
			})
			+ "';return out;")
			.replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(/\r/g, '\\r')
			.replace(/(\s|;|}|^|{)out\+='';/g, '$1').replace(/\+''/g, '')
			.replace(/(\s|;|}|^|{)out\+=''\+/g,'$1out+=');
		if(c.with)
			str = "with("+c.varname+"){"+str+"}"
		try {
			return new Function(c.varname, str);
		} catch (e) {
			throw e + ' in ' + str;
		}
	};

	doT.compile = function(tmpl, def) {
		return doT.template(tmpl, null, def);
	};
	
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
	
	doT.render = function(tmpl)
	{
		if (!cache[tmpl])
		{
			var src = doT.autoload(tmpl)
			if (false === src)
				throw 'Template not found: ' + tmpl
			doT.addCached(tmpl, doT.compile(src))
		}
		return cache[tmpl].apply(this, Array.prototype.slice.call(arguments, 1))
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
