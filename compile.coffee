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
        if file.match /.(haml|slim)$/
          compile_with_ruby file, @
          file = file.replace new RegExp("#{path.extname file}$"), ''
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

  ruby_server = null
  do new flow
    error: ->
      ruby_server.kill('SIGINT') if ruby_server
      finalcb? arguments...
    blocks: [
      ->
        return @() unless data.ruby_server == true
        data.ruby_server =
          host: 'localhost'
          port: 4000
        ruby_env = process.env
        ruby_env.RACK_ENV = 'production'
        ruby_server = child.spawn path.join(__dirname, 'bin', 'dot-compile-server'),
          ["-p#{data.ruby_server.port}", data.base], env: ruby_env
        started = false
        ruby_server.on 'error', (err) => @ err
        ruby_server.stderr.on 'data', (data) =>
          # console.log data.toString()
          return if started
          if /has taken the stage/.test data.toString()
            started = true
            console.error 'ruby-server started'
            @()
      ->
        readItem file, @multi() for file in data.files
        @multi() null
      (err, results) ->
        ruby_server.kill('SIGINT') if ruby_server
        finalcb? err, doT.exportCached()
    ]

  # private helpers
  compile_with_ruby = (file, callback) ->
    return child.exec "haml '#{file}'", callback unless data.ruby_server
    filename = file.replace new RegExp("#{path.extname file}$"), '.html'
    request = '/' + path.relative(data.base, filename)
    http.get(
      host:   data.ruby_server.host
      port:   data.ruby_server.port
      path:   request
      (res) ->
        res_data = ''
        res.on 'data',  (chunk) -> res_data += chunk
        res.on 'error', (err) -> callback? err
        res.on 'end', ->
          unless 300 > @statusCode
            return callback? new Error "#{@statusCode} @ #{file}"
          callback? null, res_data
    ).on 'error', (err) -> callback? err
