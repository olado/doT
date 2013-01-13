dot = require 'doT'

module.exports = dot

(->
  @compile = dot.render

  @__express: (filename, options, cb) ->
    try
      cb null, dot.render
    catch err
      cb err
).call dot
