module.exports = (data, finalcb) ->
  fs    = require 'fs'
  path  = require 'path'
  flow  = require 'flow'
  doT   = data.doT ? require './doT'
  child = require 'child_process'

  # wait till it apears in release
  flow.anyError = (results) ->
    for r in results
      return r[0] if r[0]
    null

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
            return @MULTI() err if err
            for file in files
              readItem path.join(item, file), @MULTI()
            @MULTI() null
          (results) ->
            item_cb flow.anyError results
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
      for file in data.files
        readItem file, @MULTI()
      @MULTI() null
    (results) ->
      return unless finalcb
      finalcb flow.anyError(results), doT.exportCached()
  )
