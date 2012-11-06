#doT.js

Created in search of the fastest and concise JavaScript templating function with emphasis on performance under V8 and nodejs. It shows great performance for both nodejs and browsers.

##doT.js is fast, small and has no dependencies

###Features:

- custom delimiters
- runtime evaluation
- runtime interpolation
- compile-time evaluation
- partials support
- conditionals support
- array iterators
- encoding
- control whitespace - strip or preserve
- streaming friendly
- use it as logic-less or with logic, it is up to you

\+ extra:

- autoloading from dom elements & files (or custom functions)
- caching
- exporting/importing cached templates
- dynamic includes

##Docs
###Native Docs, live playground and samples:
http://olado.github.com/doT

###Extra features docs
####API
```javascript
doT.addCached(id, tmplFunc)
doT.setCached(cacheObj)
doT.getCached() // returns cache object
doT.exportCached() // returns cache object as string
doT.render(tmplName, [args, ...])
// or
dot.render({ name: tmplName, args: argsArray })
/*render cached template or try autoloading.
Throws exception if no matching tmpl found.*/
```

####Autoloading
You can set `doT.autoload` to you own function(tmplName) or use one of `doT.autoloadDOM(opts)` (default) or `doT.autoloadFS(opts)`.

`doT.autoloadDOM(opts)` currently doesn't support any options. It looks for DOM element with `id = tmplName` and `type = "text/x-dot-tmpl"`.

`doT.autoloadFS(opts)` used for serverside templating. You should specify options:

- `fs` - filesystem module
- `root` - path to templates directory

```javascript
doT.autoload = doT.autoloadFS({
	fs: fs,
	root: '/path/to/dir'
})
```
It swaps dots with slashes so `some.deep.file` template will be looked for in `/path/to/dir/some/deep/file.tmpl`.

####tmpls
`{{@tmplName([args, ...])}}` turns into `doT.render('tmplName'[, args, ...])`.

Note! To use it in serverside templates you should add `doT` to global scope like this
```javascript
var doT = require( 'doT' )
global.doT = doT
```

`{{:obj :val:key}} ... {{:}}` iterates through `obj` with `for .. in` construction.

```html
<script id="tmpl1" type="text/x-dot-tmpl">From tmpl1: {{=it.x}}; {{@tmpl2(it.y)}}</script>
<script id="tmpl2" type="text/x-dot-tmpl">From tmpl2: {{=it}}</script>
<script id="tmpl1" type="text/javascript">alert(doT.render('tmpl1', {x:1, y:2}))</script>
```
Should show 'From tmpl1: 1; From tmpl2: 2'

####Dynamic includes
Instead of having split `header.tmpl` & `footer.tmpl` and including it in every template, you can have `html.tmpl`:
```html
<!DOCTYPE html>
<html>
	<head>
		<title>doT</title>
	</head>
	<body>
{{@@content()}}
	</body>
</html>
```
and render it like this
```javascript
doT.render( 'html', {
	items: [ 1, 2, 3 ],
	'_dynamic': {
		'content': { name: 'first' }
	}
} )

// or
doT.render( 'html', {
	'_dynamic': {
		'content': {
			name: 'second',
			args: [{ item: {value: 'value'} }]
		}
	}
} )
```
If no args specified current arguments are used. So

- in first case `{{@@content()}}` equals to `{{=doT.render({name: 'first', args: arguments}}`.
- in second: `{{=doT.render(it._dynamic[ 'content' ])}}` and `second` template would be used.

####compile options
Also compile-time option 'with' available (default to true). It wraps function body in 'with' construction which allows use properties directly (without it. prefix).

- `true` sets doT.templateSettings.varname as argument for with
- you can specify your own argument
- `false` disables it

**Warning!** Be careful with this option, cause 'with' will fail if you run tmpl function with no (or less then specified) args.

####compile-doT.js [-b/--base dir] path[...]
Compiles templates from files in cache object.
If path is directory it will walk it through recursively.

If --base specified template ids would be generated relative to this dir (/ replaced with .), otherwise just files basenames are used.

For `-b root root/t1.tmpl root/t2.tmpl root/dir1/dir2/t1.tmpl` ids would be `[t1, t2, dir1.dir2.t1]`.

It requires `optimist` module, so install it before use.

##Note about doU.js:
doU.js is here only so that legacy external tests do not break. Use doT.js.
doT.js with doT.templateSettings.append=false provides the same performance as doU.js.

##License:
- doT is an open source component of http://bebedo.com
- doT is licensed under the MIT License. (See LICENSE-DOT)
