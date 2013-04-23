fs    = require 'fs'
path  = require 'path'
flow  = require 'flow-coffee'
child = require 'child_process'

module.exports = (data, finalcb) ->
  doT   = data.doT ? require './doT'

  readItem = (item, callback) ->
    flow.exec(
      ->
        fs.stat item, @
      (err, stat) ->
        return @ err if err
        return readFile item, @ unless stat.isDirectory()
        item_cb = @
        flow.exec(
          ->
            fs.readdir item, @
          (err, files) ->
            return @multi() err if err
            readItem path.join(item, file), @multi() for file in files
            @multi() null
          (err, results) ->
            item_cb err
        )
      (err) ->
        callback err
    )

  readFile = (file, callback) ->
    flow.exec(
      ->
        #TODO: prefilters
        if file.match /.haml$/
          child.exec "haml '#{file}'", @
          file = file.slice 0, -5
        else
          fs.readFile file, @
      (err, text) ->
        return @ err if err
        id = path.basename file, path.extname file
        if data.base
          rel = path.relative(data.base, path.dirname file).replace /\//g, '.'
          id  = "#{rel}.#{id}" if rel
        try
          f = doT.compile text
          doT.addCached id, f
        catch e
          return @ e
        @ null, f
      (err, f) ->
        callback err, f
    )

  flow.exec(
    ->
      readItem file, @multi() for file in data.files
      @multi() null
    (err, results) ->
      finalcb? err, doT.exportCached()
  )
