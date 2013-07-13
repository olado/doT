fs    = require 'fs'
path  = require 'path'
child = require 'child_process'
http  = require 'http'
flow  = require 'flow-coffee'

module.exports = (data, finalcb) ->
  doT   = data.doT ? require './'

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
    # start = new Date
    flow.exec(
      ->
        #TODO: prefilters
        if file.match /.haml$/
          compile_haml file, @
          file = file.slice 0, -5
        else
          fs.readFile file, @
      (err, text) ->
        # console.log text
        # console.log +(new Date) - start
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

  haml_server = null
  do new flow
    error: ->
      haml_server.kill('SIGHUP') if haml_server
      finalcb? arguments...
    blocks: [
      ->
        return @() unless data.haml_server && data.haml_server == true
        data.haml_server =
          host: 'localhost'
          port: 4000
        haml_env = process.env
        haml_env.RACK_ENV = 'production'
        haml_server = child.spawn 'haml-server',
          ["-p#{data.haml_server.port}", data.base], env: haml_env
        started = false
        haml_server.on 'error', (err) => @ err
        haml_server.stderr.on 'data', (data) =>
          # console.log data.toString()
          return if started
          if /(start|already)/.test data.toString()
            started = true
            console.error 'haml-server started'
            @()
      ->
        readItem file, @multi() for file in data.files
        @multi() null
      (err, results) ->
        haml_server.kill('SIGHUP') if haml_server
        finalcb? err, doT.exportCached()
    ]

  # private helpers
  compile_haml = (file, callback) ->
    return child.exec "haml '#{file}'", callback unless data.haml_server
    http.get(
      host:   data.haml_server.host
      port:   data.haml_server.port
      path:   '/' + path.relative(data.base, file).replace /\.haml$/, '.html'
      (res) ->
        res_data = ''
        res.on 'data',  (chunk) -> res_data += chunk
        res.on 'error', (err) -> callback? err
        res.on 'end', ->
          unless 300 > @statusCode
            return callback? new Error "#{@statusCode} @ #{file}"
          callback? null, res_data
    ).on 'error', (err) -> callback? err
