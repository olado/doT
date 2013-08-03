class DotCore
  constructor: (settings = {}) ->
    @autoload = @constructor.autoloadDOM()
    @cache    = {}
    @[key] = val for key, val of settings

  # template compilation
  compile: (tmpl, compileParams = {}) ->
    compileParams.def ||= {}
    compileParams.doT ||= @
    mangles_list = Object.keys(@mangles).sort()
    for m_id, m_name of mangles_list
      tmpl = @mangles[m_name].call compileParams, tmpl, compileParams
    tmpl

  # cache functions
  getCached: (tmpl) ->
    return @cache unless tmpl
    throw new Error "Template not found: #{tmpl}" unless @cache[tmpl]
    @cache[tmpl]

  setCached: (@cache) ->

  exportCached: ->
    str = ""
    str += ",\"#{id}\": #{f.toString()}" for id, f of @cache
    "{#{str[1..]}}"

  addCached: (id, fn) ->
    if 'object' == typeof id
      @cache[i] = f for i, f of id
    else
      @cache[id] = fn
    @

  # #render() for transparent autoloding & caching
  render: (tmpl) ->
    tmpl = name: tmpl unless 'object' == typeof tmpl
    fn = null
    unless fn = @cache[tmpl.name]
      if false == src = @autoload tmpl.name
        throw new Error "Template not found: #{tmpl.name}"
      @addCached tmpl.name, fn = @compile src
    fn.apply @, tmpl.args || Array::slice.call arguments, 1

  # autoload implementations
  @autoloadDOM: (opts) -> (name) ->
    src = document.getElementById name
    return false unless src?.type is 'text/x-dot-tmpl'
    src.innerHTML

  @autoloadFS: (opts) ->
    opts.fs ||= require 'fs'
    (name) ->
      try
        opts.fs.readFileSync "#{opts.root}/#{name.replace('.', '/')}.tmpl"
      catch e
        false

  @autoloadFail: -> false

  autoload: @autoloadFail

# register in global scope
if module?.exports
  module.exports = DotCore
else if define?.amd
  define -> DotCore
else
  @DotCore = DotCore
