// doT.js
// 2011, Laura Doktorova, https://github.com/olado/doT
// 2013, modified by spmbt0 (iterHash iterator in objects with conditions)
// Licensed under the MIT license.

(function(){
	"use strict";

	var doT11 = {
		version: '1.1.0',
		templateSettings: {
			evaluate:    /\{\{([\s\S]+?(\}?)+)\}\}/g, //{{.+}}
			interpolate: /\{\{=([\s\S]+?)\}\}/g, //{{=.+}}
			encode:      /\{\{!([\s\S]+?)\}\}/g, //{{!.+}}
			use:         /\{\{#([\s\S]+?)\}\}/g, //{{#.+}}
			useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
			define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
			defineParams:/^\s*([\w$]+):([\s\S]+)/, // .:.
			conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g, //{{? .* }}
			iterate:     /\{\{~\s*(?:\}\}|(.+?)\s*(?:\:\s*([\w$]*)\s*(?:\:\s*([\w$]*))?\s*)?\}\})/g, //{{~.*:.*:.*}}
			iterHash:    /\{\{@\s*(?:\}\}|(.+?)\s*(?:\:\s*([\w$]*)\s*(?:\:\s*([\w$]*))?\s*\:?((?:[^}]|\}(?!\}))*)\s*)?\}\})/g, //{{@.*:.*:.*:.*}}
			varname:	'it',
			strip:		true,
			append:		true,
			selfcontained: false
		},
		template: undefined, //fn, compile template
		compile:  undefined  //fn, for express
	}, global;

	if(typeof module !=='undefined' && module.exports)
		module.exports = doT11;
	else if(typeof define ==='function' && define.amd)
		define(function(){return doT11;});
	else{
		global = (function(){ return this || (0,eval)('this'); })(); //TODO eval
		global.doT11 = doT11;
	}
	function encodeHTMLSource(){
		var encodeHTMLRules = { "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "/": '&#47;' },
			matchHTML = /&(?!#?\w+;)|<|>|"|'|\//g;
		return function(){
			return this ? this.replace(matchHTML, function(m){return encodeHTMLRules[m] || m;}) : this;
		};
	}
	String.prototype.encodeHTML = encodeHTMLSource();

	var startend = {
		append: { start: "'+(",      end: ")+'",      endencode: "||'').toString().encodeHTML()+'" },
		split:  { start: "';out+=(", end: ");out+='", endencode: "||'').toString().encodeHTML();out+='"}
	}, skip = /$^/;

	function resolveDefs(c, block, def){
        //'resolveDefs'.wcl(typeof block)
		if(typeof block =='undefined'|| block ==null) return;
		return (block+'')
		.replace(c.define || skip, function(m, code, assign, value){
			if(code.indexOf('def.') ==0)
				code = code.substring(4);
			if(!(code in def)){
				if(assign ==':'){
					if(c.defineParams) value.replace(c.defineParams, function(m, param, v){
						def[code] = {arg: param, text: v};
					});
					if(!(code in def)) def[code] = value;
				}else
					new Function('def',"def['"+code+"']="+ value)(def);
			}
			return '';
		})
		.replace(c.use || skip, function(m, code){
			if(c.useParams) code = code.replace(c.useParams, function(m, s, d, param){
				if(def[d] && def[d].arg && param){
					var rw = (d +':'+ param).replace(/'|\\/g,'_');
					def.__exp = def.__exp || {};
					def.__exp[rw] = def[d].text.replace(new RegExp('(^|[^\\w$])'+ def[d].arg +'([^\\w$])','g'),'$1'+ param +'$2');
					return s + "def.__exp['"+ rw +"']";
				}
			});
			var v = new Function('def','return ' + code)(def);
			return v ? resolveDefs(c, v, def) : v;
		});
	}
	function unescape(code){
		return code.replace(/\\('|\\)/g,'$1').replace(/[\r\t\n]/g,' ');
	}
	doT11.template = function(tmpl, c, def){
		c = c || doT11.templateSettings;
		var cse = c.append ? startend.append : startend.split, needhtmlencode, sid = 0, indv,
			str = (c.use || c.define) ? resolveDefs(c, tmpl, def ||{}) : tmpl;

		str = ("var out='" + (c.strip ? (str||'').replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g,' ')
			.replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,''): str ||'')
			.replace(/'|\\/g, '\\$&')
			.replace(c.interpolate || skip, function(m, code){
				return cse.start + unescape(code) + cse.end;
			})
			.replace(c.encode || skip, function(m, code){
				needhtmlencode = true;
				return cse.start + unescape(code) + cse.endencode;
			})
			.replace(c.conditional || skip, function(m, elsecase, code){
				return elsecase ?
					(code ? "';}else if("+ unescape(code) +"){out+='" : "';}else{out+='") :
					(code ? "';if("+ unescape(code) +"){out+='" : "';}out+='");
			})
			.replace(c.iterate || skip, function(m, iterate, vname, iname){
				if(!iterate) return "';} } out+='";
				sid++; indv = iname ||'i'+ sid; iterate = unescape(iterate);
				return "';var arr"+ sid +'='+ iterate +';if(arr'+ sid +'){var '
					+ (vname = vname ||'arrI'+ sid) +','+ indv +'=-1,l'+ sid +'=arr'+ sid +'.length-1;while('+ indv +'<l'+ sid +'){'
					+ vname +'=arr'+ sid +'[++'+ indv +"];out+='";
			})
			.replace(c.iterHash || skip, function(m, iterHash, vname, iname, cond){ //m, хеш, значение, индекс
				if(!iterHash) return "';} } out+='";
				sid++; indv = iname ||'i'+ sid; iterHash = unescape(iterHash);
				return "';var arr"+ sid +'='+ iterHash +';if(arr'+ sid +')for(var '+ indv +' in arr'+ sid +'){var '
					+ (vname = vname ||'arrI'+ sid) +'=arr'+ sid +'['+ indv +'];if('+ (cond ? vname :1) + unescape(cond||'') +"){out+='";
			})
			.replace(c.evaluate || skip, function(m, code){
				return "';" + unescape(code) + "out+='";
			})
			+ "';return out;")
			.replace(/\n/g, '\\n').replace(/\t/g,'\\t').replace(/\r/g,'\\r')
			.replace(/(\s|;|\}|^|\{)out\+='';/g,'$1').replace(/\+''/g,'')
			.replace(/(\s|;|\}|^|\{)out\+=''\+/g,'$1out+=');

		if(needhtmlencode && c.selfcontained)
			str ='String.prototype.encodeHTML=('+ encodeHTMLSource +'());'+ str;
		try{
			return new Function(c.varname, str);
		}catch(er){
			if(typeof console !=='undefined') console.log('Could not create a template function: '+ str);
			throw er;
		}
	};
	doT11.compile = function(tmpl, def){
		return doT11.template(tmpl, null, def);
	};
}());
