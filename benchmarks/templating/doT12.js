// doT.js
// 2011, Laura Doktorova, https://github.com/olado/doT
// 2013, modified by spmbt0 (iterHash iterator in objects with conditions)
// Licensed under the MIT license.

(function(){
	"use strict";
	/* global define: false, module: false */
	/*jshint unused:true, eqnull:true, evil:true, laxcomma:true, laxbreak:true */
	var doT = {
		version: '1.2.0',
		templateSettings: {
			valEncEval:  /\{\{([=!]?)([\s\S]+?(\}?)+)\}\}/g //{{=.+}} | {{!.+}} | {{.+}}
			,use:         /\{\{#([\s\S]+?)\}\}/g //{{#.+}}
			,useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g
			,define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g
			,defineParams:/^\s*([\w$]+):([\s\S]+)/ // .:.
			,conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g //{{? .* }}
			,iterate:     /\{\{~\s*(?:\}\}|(\[[\s\S]+?\]|.+?)\s*(?::\s*([\w$]*)\s*(?::\s*([\w$]*))?\s*)?\}\})/g //{{~.*:.*:.*}}
			,iterHash:    /\{\{@\s*(?:\}\}|(\{[\s\S]+?\}|\[[\s\S]+?\]|.+?)\s*(?::\s*([\w$]*)\s*(?::\s*([\w$]*))?\s*\:?((?:[^}]|\}(?!\}))*)\s*)?\}\})/g //{{@.*:.*:.*:.*}}
			,varname:	'it'
			,strip:		true
			,append:		true //or split of concatenation
			,useGlobalEncode: true
			,globalName:'doT12'
		},
		compile: function(tmpl, def){ //fn, for express
			return doT.template(tmpl, null, def);
		},
		template: function(tmpl, c, def){
			c = c ||{};
			for(var i in dS) //conditional extend
				if(c[i] ===undefined)
					c[i] = dS[i];
			var sid =0
				,indv
				,str = (c.use || c.define ? resolveDefs(c, tmpl, def ||{}) : tmpl) ||''
				,skip = /$^/;
			str = ("var out='" + (c.strip ? str.replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g,' ')
						.replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g,''): str)
					.replace(/'|\\/g,'\\$&') //escape "'" and "\"
					.replace(c.conditional || skip, function(m, elsecase, code){ // ? expr | ?? expr | ?? --- if | else if | else
						return elsecase ?
							(code ? "'}else if("+ unescape(code) +"){out+='" : "'}else{out+='") :
							(code ? "';if("+ unescape(code) +"){out+='" : "'}out+='");
					})
					.replace(c.iterate || skip, function(m, iterate, vname, iname){ // ~
						if(!iterate) return "';}}out+='";
						sid++; indv = iname ||'i'+ sid; iterate = unescape(iterate);
						return "';var arr"+ sid +'='+ iterate +';if(arr'+ sid +'){var '+ (vname = vname ||'arrI'+ sid) +','
							+indv +'=-1,l'+ sid +'=arr'+ sid +'.length-1;while('+ indv +'<l'+ sid +'){'+ vname +'=arr'+ sid
							+'[++'+ indv +"];out+='";
					})
					.replace(c.iterHash || skip, function(m, iterHash, vname, iname, cond){ // @ m, hash, value, index
						if(!iterHash) return "';}}out+='";
						sid++; indv = iname ||'i'+ sid; iterHash = unescape(iterHash);
						return "';var arr"+ sid +'='+ iterHash +';if(arr'+ sid +')for(var '+ indv +' in arr'+ sid +'){var '
							+(vname = vname ||'arrI'+ sid) +'=arr'+ sid +'['+ indv +'];if('+ (cond ? vname :1)
							+unescape(cond||'') +"){out+='";
					})
					.replace(c.valEncEval || skip, valEncEvalF) // =|!|{{ expr -- interpolate or encode or eval
				+ "';return out;")
				.replace(/([\n\t\r])/g,'\\$1')
				.replace(/\+''|(\s|;|\}|^|\{)(out\+='';|(out\+=)''\+)/g,'$1$3');//needhtmlencode = !dS.useGlobalEncode &&"op =='!'";
			try{
				return new Function(c.varname, str = (needhtmlencode ? doT.encHtmlStr :'')+ str );
			}catch(er){
				if(typeof console !=='undefined') console.log('Could not create a template function: '+ str);
				throw er;
			}
		} //fn, compile template
		,encHtmlStr:'(function(encRules, r){return function(a){return (a+"").replace(r, function(m){return encRules[m]})} })'
			+'({"&":"&#38;","<":"&#60;",">":"&#62;","\\"":"&#34;","\'":"&#39;","/":"&#47;"}, /&(?!#?\\w+;)|[<>"\'/]/g);'
	}
	,dS = doT.templateSettings
	,glob = (dS.useGlobalEncode ? dS.globalName +'.':'') +'encodeHTML('
	,startend = {
		append: {"=":"'+(",      "!":"'+"+ glob,     "":"';", ")=":")+'",      ")!":")+'",      ")":";out+='"}
		,split: {"=":"';out+=(", "!":";out+="+ glob, "":"';", ")=":");out+='", ")!":");out+='", ")":";out+='"}
	}
	,cse = dS.append ? startend.append : startend.split
	,resolveDefs = function(c, block, def){ if(block !=null){
		return (block +'').replace(c.define || skip, function(m, code, assign, value){ // ##
			if(code.indexOf('def.') ===0)
				code = code.substring(4);
			if(!(code in def)){
				if(assign ==':'){
					if(c.defineParams) value.replace(c.defineParams, function(m, param, v){
						def[code] = {arg: param, text: v};
					});
					if(!(code in def)) def[code] = value;
				}else
					new Function('def',"def['"+ code +"']="+ value)(def);
			}
			return '';
		})
		.replace(c.use || skip, function(m, code){ // #
			if(c.useParams) code = code.replace(c.useParams, function(m, s, d, param){
				if(def[d] && def[d].arg && param){
					var rw = (d +':'+ param).replace(/'|\\/g,'_');
					def.__exp = def.__exp ||{};
					def.__exp[rw] = def[d].text.replace(RegExp('(^|[^\\w$])'+ def[d].arg +'([^\\w$])','g'),'$1'+ param +'$2');
					return s +"def.__exp['"+ rw +"']";
				}
			});
			var v = new Function('def','return '+ code)(def);
			return v ? resolveDefs(c, v, def) : v;
		});
	}}
	,unescape = window.chrome ? function(code){
			return code.replace(/\\('|\\)/g,'$1').replace(/[\n\t\r]/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>'); //Chrome <,>
		} : function(code){return code.replace(/\\('|\\)/g,'$1').replace(/[\n\t\r]/g,' ')}
	,global
	,needhtmlencode
	,cse3 = cse[')=']
	,valEncEvalF = window.chrome ? function(m, op, code){
			needhtmlencode = op =='!';
			return cse[op] + code.replace(/\\('|\\)/g,'$1').replace(/[\n\t\r]/g,' ').replace(/&lt;/g,'<').replace(/&gt;/g,'>') + (op ? cse3 :";out+='");
		} : function(m, op, code){
			needhtmlencode = op =='!';
			return cse[op] + code.replace(/\\('|\\)/g,'$1').replace(/[\n\t\r]/g,' ') + (op ? cse3 :";out+='");
		};

	if(typeof module !=='undefined'&& module.exports)
		module.exports = doT;
	else if(typeof define =='function' && define.amd)
		define(function(){return doT;});
	else{ /* jshint ignore:start */
		global = (function(){ return this || (0,eval)('this'); })();
		global[dS.globalName] = doT; /* jshint ignore:end */
	}
	doT.encHtmlStr = dS.useGlobalEncode ? (doT.encodeHTML = eval(doT.encHtmlStr),''):'var encodeHTML='+ doT.encHtmlStr;
}());
