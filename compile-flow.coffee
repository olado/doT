#!/usr/bin/env js

fs = require 'fs'
path = require 'path'
flow = require 'flow'
doT = require './doT.js'
#DIR = path.dirname path.dirname process.argv[1]
#doT = require DIR + '/misc/js/doT.js'

asyncCalls = 0
asyncStarted = () -> asyncCalls += 1
asyncDone = () ->
	asyncCalls -= 1
	asyncAfterAll() if 0 == asyncCalls

readItem = ( item, callback ) ->
	flow.exec(
		->
			fs.stat item, @
		( err, stat ) ->
			if err
				process.stderr.write err
				@(err)
			else if stat.isDirectory()
				cb = @
				flow.exec(
					->
						fs.readdir item, @
					( err, files ) ->
						if err
							process.stderr.write err
							@(err)
						else
							files.forEach ( file ) => readItem path.join( item, file ), @MULTI()
					-> cb(null)
				)
			else
				readFile item, @
		-> callback(null)
	)

readFile = ( file, callback ) ->
	flow.exec(
		->
			fs.readFile file, @
		( err, data ) ->
			if err
				process.stderr.write "Error reading file '#{file}': '#{err}\n"
				@(e)
			else
				id = path.basename file, path.extname file
				if argv.base
					rel = path.relative( argv.base, path.dirname file)
						.replace /\//g, '.'
					id = "#{rel}.#{id}" if rel
				try
					f = doT.compile data
					doT.addCached id, f
					@(null, f)
				catch e
					process.stderr.write "Error compiling file '#{file}': '#{e}'\n"
					@(e)
		-> callback(null)
	)

argv = require( 'optimist' )
	.default( base: '' )
	.alias( base: 'b' )
	.argv

flow.exec(
	->
		argv._.forEach ( val, i ) => readItem val, @MULTI()
	->
		process.stdout.write doT.exportCached()
)
