module.exports = (data, finalcb) ->
  fs    = require 'fs'
  path  = require 'path'
  flow  = require 'flow'
  doT   = require './doT.js'

  readItem = ( item, callback ) ->
    flow.exec(
      ->
        fs.stat item, @
      ( err, stat ) ->
        if err
          process.stderr.write err
          @ err
        else if stat.isDirectory()
          cb = @
          flow.exec(
            ->
              fs.readdir item, @
            ( err, files ) ->
              if err
                process.stderr.write err
                @ err
              else
                files.forEach ( file ) =>
                  readItem path.join( item, file ), @MULTI()
            -> cb null
          )
        else
          readFile item, @
      -> callback null
    )

  readFile = ( file, callback ) ->
    flow.exec(
      ->
        fs.readFile file, @
      ( err, text ) ->
        if err
          process.stderr.write "Error reading file '#{file}': '#{err}\n"
          @ err
        else
          id = path.basename file, path.extname file
          if data.base
            rel = path.relative(data.base, path.dirname file)
              .replace /\//g, '.'
            id = "#{rel}.#{id}" if rel
          try
            f = doT.compile text
            doT.addCached id, f
            @ null, f
          catch e
            process.stderr.write "Error compiling file '#{file}': '#{e}'\n"
            @ e
      -> callback(null)
    )

  flow.exec(
    -> data.files.forEach ( val, i ) => readItem val, @MULTI()
    -> finalcb(null, doT.exportCached()) if finalcb
  )
