(function() {
	var doT = require('../doT.js'),
		data = { f1: 1, f2: 2, f3: 3},
		defs = { a: 100, b: 200};

	var fs = require('fs');
	defs.externalsnippet = fs.readFileSync(process.argv[1].replace(/\/[^\/]*$/,'/snippet.txt'));
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
