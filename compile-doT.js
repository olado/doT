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

var asyncCalls = 0

argv._.forEach( function( val, i ) { readItem( val ) } )
function asyncAfterAll() { process.stdout.write( doT.exportCached() ) }

function asyncStarted() { asyncCalls += 1 }
function asyncDone()
{
	asyncCalls -= 1
	if ( 0 == asyncCalls )
		asyncAfterAll()
}

function readItem( item )
{
	if ( fs.statSync( item ).isDirectory() )
	{
		asyncStarted()
		fs.readdir( item, function( err, files ) {
			if ( err )
				process.stderr.write( err )
			else
				files.forEach( function( file ){ readItem( path.join( item, file ) ) } )
			asyncDone()
		} )
	} else
	{
		readFile( item )
	}
}

function readFile( file )
{
	asyncStarted()
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
		asyncDone()
	} )
}
