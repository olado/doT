#!/usr/bin/env js

var fs = require( 'fs' )
var path = require( 'path' )

//var doT = require( 'doT' )
var DIR = path.dirname( path.dirname( process.argv[1] ) )
var doT = require( DIR + '/misc/js/doT.js' )

var readDone = 0
var readAll = 0
var allStarted = false

process.argv.forEach( function( val, i ) {
	if ( 2 > i ) return;
	
	var item = val
	if ( fs.statSync( item ).isDirectory() )
	{
		var dir = item
		fs.readdirSync( dir ).forEach( function( item ){ readFile( path.join( dir, item ) ) } )
	} else
	{
		readFile( item )
	}
} )
allStarted = true

function readFile( file )
{
	++readAll
	fs.readFile( file, function( err, data )
	{
		if ( err )
		{
			process.stderr.write( 'Error reading file "' + file + '": ' + err + '\n' )
		} else
		{
			var id = path.basename( file, path.extname( file ) )
			var f = doT.compile( data )
			doT.addCached( id, f )
		}
		
		++readDone
		if ( allStarted && readDone == readAll )
			process.stdout.write( doT.exportCached() )
	} )
}
