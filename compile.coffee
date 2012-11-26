#!/usr/bin/env js

fs = require 'fs'
path = require 'path'
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
				@()
			else if stat.isDirectory()
				flow.exec(
					->
						fs.readdir item, @
					( err, files ) ->
						if err
							process.stderr.write err
							@()
						else
							files.forEach ( file ) -> readItem path.join( item, file ), @.MULTI()
					-> @()
				)
			else
				readFile item, @
		-> callback()
	)

readFile = ( file, callback ) ->
	flow.exec(
		->
			fs.readFile file, @
		( err, data ) ->
			if err
				process.stderr.write "Error reading file '#{file}': '#{err}\n"
			else
				id = path.basename file, path.extname file
				if argv.base
					rel = path.relative( argv.base, path.dirname file)
						.replace /\//g, '.'
					id = "#{rel}.#{id}" if rel
				try
					f = doT.compile data
					doT.addCached id, f
				catch err
					process.stderr.write "Error compiling file '#{file}': '#{err}'\n"
			@()
		-> callback()
	)

argv = require( 'optimist' )
	.default( base: '' )
	.alias( base: 'b' )
	.argv

flow.exec(
	->
		argv._.forEach ( val, i ) -> readItem val, this.MULTI()
	->
		process.stdout.write doT.exportCached()
)
