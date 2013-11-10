Created in search of the fastest and concise JavaScript templating function with emphasis on performance under V8 and nodejs. It shows great performance for both nodejs and browsers.

doT.js is fast, small and has no dependencies.

## Features
    custom delimiters
    runtime evaluation
    runtime interpolation
    compile-time evaluation
    partials support
    conditionals support
    array iterators
    object iterators with filters (since v.1.1)
    encoding
    control whitespace - strip or preserve
    streaming friendly
    use it as logic-less or with logic, it is up to you

## Docs, live playground and samples

http://olado.github.com/doT (todo: update docs with new features added in version 1.0.0)

## New in version 1.1.0 (by author spmbt)

###doT.js iterations by objects with conditions:
	* Iterator by object (may be just "it"):

	{{@ it.myObject : value : key}}
		<div>{{=value }} === it.myObject[{{=it.myObject[key]}}] </div>
	{{@}}
	* Iterator by object with default params:

	{{@ it.myObject : value}}
		<div>{{=value }} - value; [{{=i1}}] (default key if this iterator is first) </div>
	{{@}}

	{{@ it.myObject : : key}}
		<div>{{=key}} - key; [{{=it.myObject[key]}}] (default key if this iterator is first) </div>
	{{@}}
	* Iterator by object with filter: if it need take part of object or filter by property of object, then, for example

	{{@ it.myObject : value : key :.hasOwnProperty(key)}}
		<div>{{=key}} - key; [{{=it.myObject[key]}}] (default key if this iterator is first) </div>
	{{@}}

or any single-line or multiline expression. It means: "value.hasOwnProperty(key)".

We may to filter by any expression without context "value" if print comma: 

	{{@ it.myObject : value : key :, /y\\d+/.test(key)}}

(means expression: "value, /y\d+/.test(key)"). It takes all properties of it.myObject with key which have first letter "y".

###Not need any default parameters in iterator by Array
	{{~ it.myObject : : key}}
		<div>{{=key}} - key; [{{=it.myObject[key]}}] (default key if this iterator is first) </div>
	{{~}}
	{{~ it.myObject : value}}
		<div>{{=value}} - value </div>
	{{~}}

####Tests of performance for version 1.1.0

(include previous tests and benchmarks of iterators)

	doT/benchmarks/compileBench.html - full text (compile + execition)
	doT/benchmarks/index.html - execution of compiled patterns only
## New in version 1.0.0

####Added parameters support in partials

	{{##def.macro:param:
		<div>{{=param.foo}}</div>
	#}}

	{{#def.macro:myvariable}}

####Node module now supports auto-compilation of dot templates from specified path

	var dots = require("dot").process({ path: "./views"});

This will compile .def, .dot, .jst files found under the specified path.
Details
   * It ignores sub-directories.
   * Template files can have multiple extensions at the same time.
   * Files with .def extension can be included in other files via {{#def.name}}
   * Files with .dot extension are compiled into functions with the same name and
   can be accessed as renderer.filename
   * Files with .jst extension are compiled into .js files. Produced .js file can be
   loaded as a commonJS, AMD module, or just installed into a global variable (default is set to window.render)
   * All inline defines defined in the .jst file are
   compiled into separate functions and are available via _render.filename.definename
 
   Basic usage:
 ```
        var dots = require("dot").process({path: "./views"});
        dots.mytemplate({foo:"hello world"});
 ```
   The above snippet will:
	* Compile all templates in views folder (.dot, .def, .jst)
  	* Place .js files compiled from .jst templates into the same folder
     	   These files can be used with require, i.e. require("./views/mytemplate")
  	* Return an object with functions compiled from .dot templates as its properties
  	* Render mytemplate template
 
####CLI tool to compile dot templates into js files

	./bin/dot-packer -s examples/views -d out/views

## Notes
    doU.js is here only so that legacy external tests do not break. Use doT.js.
    doT.js with doT.templateSettings.append=false provides the same performance as doU.js.

## Author
Laura Doktorova @olado
version 1.1 is modified by author spmbt

## License
doT is licensed under the MIT License. (See LICENSE-DOT)
