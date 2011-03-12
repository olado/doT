(function() {
	var doT = require('../doT.js'),
		data = { f1: 1, f2: 2, f3: 3};

	require('fs').readFile(process.argv[1].replace(/\/[^\/]*$/,'/snippet.txt'), function (err, snippet) {
		if (err) {
			console.log("Error reading snippet.txt " + err);
		} else {
			var doTCompiled = doT.template(snippet.toString());
			console.log("Generated function: \n" + doTCompiled.toString());
			console.log("Result of calling with " + JSON.stringify(data) + " :\n" + doTCompiled(data));
		}
	});
}());
