(->
  @compile = @render
  @__express = (filename, options, cb) =>
    try
      cb null, @render
    catch err
      cb err
).call module.exports = require 'doT'
