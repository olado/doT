Created in search of the fastest and concise JavaScript templating function with emphasis on performance under V8 and nodejs. It shows great performance for both nodejs and browsers.

doT.js is fast, small and has no dependencies.

## Features:
    custom delimiters
    runtime evaluation
    runtime interpolation
    compile-time evaluation
    partials support
    conditionals support
    array iterators
    encoding
    control whitespace - strip or preserve
    streaming friendly
    use it as logic-less or with logic, it is up to you

## Docs, live playground and samples:

http://olado.github.com/doT (todo: update docs with new features added in version 1.0.0)

## New in version 1.0.0:

Compile tool to compile dot templates into js (thanks to @Katahdin https://github.com/Katahdin/dot-packer ):

	./bin/dottojs -s examples/views -d out/views

Node module now supports auto-compilation of dot templates from specified path: (see index.js)

	var dots = require("dot").process({ path: "./views"});

Added parameters support in partials:

	{{##def.macro:param:
		<div>{{=param.foo}}</div>
	#}}

	{{#def.macro:myvariable}}

## Notes:
    doU.js is here only so that legacy external tests do not break. Use doT.js.
    doT.js with doT.templateSettings.append=false provides the same performance as doU.js.

## Author:
Laura Doktorova @olado

## License:
doT is licensed under the MIT License. (See LICENSE-DOT)
