(function() {
	var doU = require('../doU.js'),
		data = { f1: 1, f2: 2, f3: 3};

	require('fs').readFile(process.argv[1].replace(/\/[^\/]*$/,'/snippet.txt'), function (err, snippet) {
		if (err) {
			console.log("Error reading snippet.txt " + err);
		} else {
			var doUCompiled = doU.template(snippet.toString());
			console.log("Generated function: \n" + doUCompiled.toString());
			console.log("Result of calling with " + JSON.stringify(data) + " :\n" + doUCompiled(data));
		}
	});
}());
