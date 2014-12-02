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
    encoding
    control whitespace - strip or preserve
    streaming friendly
    use it as logic-less or with logic, it is up to you

## Docs, live playground and samples

http://olado.github.com/doT (todo: update docs with new features added in version 1.0.0)

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

## Example for express
	Many people are using doT with express. I added an example of the best way of doing it examples/express:

[doT with express](examples/express)

## Notes
    doU.js is here only so that legacy external tests do not break. Use doT.js.
    doT.js with doT.templateSettings.append=false provides the same performance as doU.js.

## Author
Laura Doktorova [@olado](http://twitter.com/olado)

## License
doT is licensed under the MIT License. (See LICENSE-DOT)

<p align="center">
  <img src="http://olado.github.io/doT/doT-js-100@2x.png" alt="logo by Kevin Kirchner"/>
</p>

Thank you [@KevinKirchner](https://twitter.com/kevinkirchner) for the logo.


