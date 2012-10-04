#!/usr/bin/env js

var fs = require( 'fs' )
var path = require( 'path' )
var argv = require( 'optimist' )
	.default({ base: '' })
	.alias({ base: 'b' })
	.argv

//var doT = require( 'doT' )
var DIR = path.dirname( path.dirname( process.argv[1] ) )
var doT = require( DIR + '/misc/js/doT.js' )

var readDone = 0
var readAll = 0
var allStarted = false

argv._.forEach( function( val, i ) { readItem( val ) } )
allStarted = true

function readItem( item )
{
	if ( fs.statSync( item ).isDirectory() )
	{
		var dir = item
		fs.readdirSync( dir ).forEach( function( item ){ readItem( path.join( dir, item ) ) } )
	} else
	{
		readFile( item )
	}
}

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
			if ( argv.base )
			{
				var rel = path.relative( argv.base, path.dirname( file ) ).replace( /\//g, '.' )
				rel && ( id = rel + '.' + id )
			}
			try
			{
				var f = doT.compile( data );
				doT.addCached( id, f )
			} catch( err )
			{
				process.stderr.write( 'Error compiling file "' + file + '": ' + err + '\n' )
			}
		}
		
		++readDone
		if ( allStarted && readDone == readAll )
			process.stdout.write( doT.exportCached() )
	} )
}
