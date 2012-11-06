#!/usr/bin/env js

var fs = require( 'fs' )
var doT = require( '../doT.js' )
global.doT = doT
doT.autoload = doT.autoloadFS({
	fs: fs,
	root: 'tmpl'
})
try
{
	var str = doT.render( 'ul', { items: [ 1, 2, 3 ] } )
	process.stdout.write( str + "\n" )
	str = doT.render( 'another.ul', { items: [ 1, 2, 3 ] } )
	process.stdout.write( str + "\n" )
} catch (e)
{
	process.stderr.write( 'Exception: ' + e + "\n" )
	process.stderr.write( 'Try to run it from `test` folder.' + "\n" )
}
