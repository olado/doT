(function(){
	var jslitmus, _, doU, doT, doT11
		data = { f1: 1, f2: 2, f3: 3, f4: "http://bebedo.com/laura"},
		snippet = '<h1>Just static text</h1>\
		<p>Here is a simple {{=it.f1}} </p>\
		<div>test {{=it.f2}}\
		<div>{{=it.f3}}</div>\
		<div>{{!it.f4}}</div>\
		</div>'
		,snippetByObj ='<h1>Text from hash</h1><div>\
			{{@it::i}} <div>{{=i}}: {{=it[i]}} : </div> {{@}}\
			{{@it:val:i}} <div>{{=i}}: {{=val}} : </div> {{@}}\
			{{@it:a}} <div>{{=a}}: {{=a}} : </div> {{@}}\
		</div>';

	if(typeof module !== 'undefined' && module.exports)
		(function runTests() {
		//var util = require('util');
		jslitmus = require('./jslitmus.js');
		doU = require('./templating/doU.js');
		doT = require('./templating/doT.js');
		doT11 = require('./templating/doT11.js');
		doT11m = require('./templating/doT11m.js');
		var passOne = 0;
			console.log("*** Compilation speed test. Small templates length: "+ snippet.length +', '+ snippetByObj.length);
			testsetup(snippet, snippetByObj);
		// Log the test results
		jslitmus.on('complete', function(test){
			//console.log(util.inspect(process.memoryUsage()));
			console.log(test.toString());
		});
		// 'all_complete' fires when all tests have finished.
		jslitmus.on('all_complete', function(){
			switch (passOne){
			case 0:
				passOne++;
					for(var i=0; i<5; i++) {snippet += snippet;
						snippetByObj += snippetByObj;
						snippetByArray += snippetByArray;}
					console.log("*** Medium templates length: "+ snippet.length +', '+ snippetByObj.length);
				break;
			case 1:
				passOne++;
					for(var i=0; i<3; i++) {snippet += snippet;
						snippetByObj += snippetByObj;
						snippetByArray += snippetByArray;}
					console.log("*** Large templates length: "+ snippet.length +', '+ snippetByObj.length);
				break;
			default:
				return;
			}

			jslitmus.clearAll();
				testsetup(snippet, snippetByObj);
			jslitmus.runAll();
		});
		// Run it!
		jslitmus.runAll();
		})();
	else
		window.onload = function(){ //runTestsInBrowser
			jslitmus = window.jslitmus;
			doU = window.doU; doT = window.doT; doT11 = window.doT11; doT11m = window.doT11m;

			var resultTmpl = doT.template("<h3>Templates length : {{=it.size}}, {{=it.size2}} </h3>	<img src='{{=it.url}}'/>");
		var currentSet = document.getElementById('small');
			testsetup(snippet, snippetByObj);
		// 'complete' fires for each test when it finishes.
		jslitmus.on('complete', function(test){
		// Output test results
			currentSet.innerHTML += test + '<br/>';
		});
		// 'all_complete' fires when all tests have finished.
		jslitmus.on('all_complete', function(){
			// Get the results image URL
			var url = jslitmus.getGoogleChart();
			if(currentSet.id === 'small'){
					currentSet.innerHTML += resultTmpl({size: snippet.length, size2: snippetByObj.length, url: url});
				setTimeout(function(){
					jslitmus.clearAll();
					currentSet = document.getElementById('large');
						for(var i =0; i < 7; i++){
							snippet += snippet;
							snippetByObj += snippetByObj; // length = "* 2**8"
						}
						testsetup(snippet, snippetByObj);
					jslitmus.runAll();
					}, 1000);
				} else {
					currentSet.innerHTML += resultTmpl({size: snippet.length, size2: snippetByObj.length, url: url});
				}
		});
		// Run it!
		jslitmus.runAll();
		};

function testsetup(snippet, snippetByObj){
		var snippetByArray = snippetByObj.replace(/@/g,'~')
			,s;
		console.log(doT11.compile(snippetByObj));
		console.log(doT11.compile(s = snippet.replace(/=it\./g, '=this.').replace(/{{!it\./g, '{{!this.') ), s);
		var snippetThis = snippet.replace(/=it\./g, '=this.').replace(/{{!it\./g, '{{!this.');
		var data2 = [], cnt =0;
		for(var i in data)
			data2[cnt++] = data[i];
		// doU with 'it'
		jslitmus.test('doU.js', function(){
			doU.template(snippet)(data);
		});
		jslitmus.test('doU.js - [loop]', function(count){while(count--){
			doU.template(snippet)(data);
		}});
		jslitmus.test('1.doT.js - using this', function(){
			doT.template(snippetThis).call(data);
		});
		jslitmus.test('2.doT.js - using this [loop]', function(count){while(count--){
			doT.template(snippetThis).call(data);
		}});
		jslitmus.test('3.doT11.js - using this [loop]', function(count){while(count--){
			doT11.template(snippetThis).call(data);
		}});
		jslitmus.test('4.doT11m.js - using this [loop]', function(count){while(count--){
			doT11m.template(snippetThis).call(data);
		}});
		jslitmus.test('1.doT.js - using it', function() {
			doT.template(snippet)(data);
		});
		jslitmus.test('2.doT.js - using it [loop]', function(count){while(count--){
			doT.template(snippet)(data);
		}});
		jslitmus.test('3.doT11.js - using it [loop]', function(count){while(count--){
			doT11.template(snippet)(data);
		}});
		jslitmus.test('4.doT11m.js - using it [loop]', function(count){while(count--){
			doT11m.template(snippet)(data);
		}});
		doT.templateSettings.append = false; // doT with 'it' and append = false
		jslitmus.test('1.doT.js - append off', function(){
			doT.template(snippet)(data);
		});
		jslitmus.test('2.doT.js - append off [loop]', function(count){while(count--){
			doT.template(snippet)(data);
		}});
		jslitmus.test('3.doT11.js - append off [loop]', function(count){while(count--){
			doT11.template(snippet)(data);
		}});
		jslitmus.test('4.doT11m.js - append off [loop]', function(count){while(count--){
			doT11.template(snippet)(data);
		}});
		jslitmus.test('doT11.js - iterator by object', function(count){while(count--){
			doT11.template(snippetByObj)(data); //iterator by root object
		}});
		jslitmus.test('doT11.js - iterator by Array', function(count){while(count--){
			doT11.template(snippetByArray)(data2);
		}});
		jslitmus.test('doT.js - iterator by Array', function(count){while(count--){
			doT.template(snippetByArray.replace(/it::/g,'it:val:i').replace(/it:a/g,'it:a:i'))(data2);
		}});
	}
})();
