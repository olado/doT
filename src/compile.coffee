module.exports = (data, finalcb) ->
  fs    = require 'fs'
  path  = require 'path'
  flow  = require 'flow'
  doT   = require './doT.js'
  child = require 'child_process'

  any_error = (results) ->
    for r in results
      return r[0] if r[0]
    null

  readItem = (item, callback) ->
    flow.exec(
      -> fs.stat item, @
      (err, stat) ->
        return @ err if err
        return readFile item, @ unless stat.isDirectory()
        item_cb = @
        flow.exec(
          -> fs.readdir item, @
          (err, files) ->
            return @MULTI err if err
            files.forEach (file) =>
              readItem path.join(item, file), @MULTI()
          (results) -> item_cb any_error results
        )
      (err) ->
        callback err
    )

  readFile = (file, callback) ->
    flow.exec(
      ->
        if file.match /.haml$/
          child.exec "haml '#{file}'", @
          file = path.basename file, '.haml'
        else
          fs.readFile file, @
      (err, text) ->
        return @ err if err
        id = path.basename file, path.extname file
        if data.base
          rel = path.relative(data.base, path.dirname file)
            .replace /\//g, '.'
          id = "#{rel}.#{id}" if rel
        f = dot_err = null
        try
          f = doT.compile text
          doT.addCached id, f
        catch e
          dot_err = e
        @ dot_err, f
      (err, f) ->
        callback err, f
    )

  flow.exec(
    -> data.files.forEach ( val, i ) => readItem val, @MULTI()
    (results) ->
      return unless finalcb
      finalcb any_error(results), doT.exportCached()
  )
