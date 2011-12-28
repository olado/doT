(function() {
	var doT = require('../doT.js'),
		fs = require('fs'),
		data = { f1: 1, f2: 2, f3: 3, altEmail: "conditional works"},
		defs = { a: 100, b: 200};

	defs.loadfile = function(path) {
		return fs.readFileSync(process.argv[1].replace(/\/[^\/]*$/,path));
	};
	defs.externalsnippet = defs.loadfile('/snippet.txt');

	fs.readFile(process.argv[1].replace(/\/[^\/]*$/,'/advancedsnippet.txt'), function (err, snippet) {
		if (err) {
			console.log("Error reading advancedsnippet.txt " + err);
		} else {
			var doTCompiled = doT.template(snippet.toString(), undefined, defs);
			console.log("Generated function: \n" + doTCompiled.toString());
			console.log("Result of calling with " + JSON.stringify(data) + " :\n" + doTCompiled(data));
		}
	});
}());
