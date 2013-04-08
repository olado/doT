###
  doT.js
  2011, Laura Doktorova, https://github.com/olado/doT
  
  doT.js is an open source component of http://bebedo.com
  Licensed under the MIT license.
###
'use strict'

startend =
  append:
    start:  "' + ("
    end:    ") + '"
    endEncode:  ").encodeHTML() + '"
  split:
    start:  "'; out += ("
    end:    "); out += '"
    endEncode: ").encodeHTML(); out += '"

doT =
  version:  '0.2.0'
  templateSettings:
    use:          /\{\{#([\s\S]+?)\}\}/g
    define:       /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g
    varname:      'it'
    strip:        true
    with:         true
    dynamicList:  'it._dynamic'
    startend:     startend.append
  startend: startend
  mangles:  {}
  tags:     {}

cache = {}
sid   = 0 # sequental id for variable names
skip  = /$^/

# register in global scope
if module?.exports
  module.exports = doT
else if define?.amd
  define -> doT
else
  @doT = doT

unless String::encodeHTML
  do ->
    rules =  "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "/": '&#47;'
    match = /&(?!#?\w+;)|<|>|"|'|\//g
    String::encodeHTML = -> @replace match, (m) -> rules[m] || m

doT.unescape = unescape = (code) ->
  code.replace(/\\('|\\)/g, '$1').replace /[\r\t\n]/g, ' '

# tags definition
tags = doT.tags
tags.interpolate =
  regex: /\{\{\s*=([\s\S]*?)\}\}/g
  func: (m, code) ->
    cse = doT.templateSettings.startend
    cse.start + unescape(code) + cse.end

tags.encode =
  regex: /\{\{\s*!([\s\S]*?)\}\}/g
  func: (m, code) ->
    cse = doT.templateSettings.startend
    cse.start + unescape(code) + cse.endEncode

tags.conditional =
  regex: /\{\{\s*\?(\?)?\s*([\s\S]*?)\}\}/g
  func: (m, elsecase, code) ->
    if elsecase
      if code
        "' ; } else if ( #{unescape(code)} ) { out += '"
      else
        "'; } else { out += '"
    else
      if code
        "'; if ( #{unescape(code)} ) { out += '"
      else
        "'; } out += '"

tags.iterate =
  regex: /\{\{\s*~\s*(?:(\S+?)\s*\:\s*([\w$]+)\s*(?:=>\s*([\w$]+))?\s*)?\}\}/g
  func: (m, iterate, iname, vname) ->
    if !iterate
      return "'; } } out += '"
    [vname, iname] = [iname, "i#{++sid}"] unless vname
    iterate = unescape iterate
    return "';
      var arr#{sid} = #{iterate};
      if( arr#{sid} ) {
        var #{vname}, #{iname} = -1, l#{sid} = arr#{sid}.length-1;
        while( #{iname} < l#{sid} ){
          #{vname} = arr#{sid}[#{iname} += 1];
          out += '"

tags.iterateFor =
  regex: /\{\{\s*:\s*(?:(\S+?)\s*\:\s*([\w$]+)\s*(?:=>\s*([\w$]+))?\s*)?\}\}/g
  func: (m, iterate, iname, vname) ->
    if !iterate
      return "'; } } out += '"
    inpname = "i#{++sid}"
    [vname, iname] = [iname, "i#{++sid}"] unless vname
    return "';
      var #{inpname} = #{iterate};
      if ( #{inpname} ) {
        var #{vname}, #{iname};
        for (#{iname} in #{inpname} ) {
          #{vname} = #{inpname}[ #{iname} ];
          out += '"

tags.content_for =
  regex: /\{\{\s*>([\s\S]*?)\}\}/g
  func: (m, id) ->
    @multiple_contents = true
    if id
      "';
      contents[current_out] = out;
      out_stack.push(current_out);
      current_out='#{unescape(id).trim()}';
      out = contents[current_out] = '"
    else
      "';
      contents[current_out] = out;
      out = contents[current_out = out_stack.pop()] += '"

tags.xx_includeDynamic =
  regex: /\{\{\s*@@\s*(\S+?)\(([\s\S]*?)\)\s*\}\}/g
  func: (m, tmpl, args) ->
    sid += 1
    vname = 'tmpl' + sid
    return "';
      var #{vname} = #{doT.templateSettings.dynamicList}[ '#{unescape(tmpl)}' ];
      if ('string' === typeof #{vname}) #{vname} = {name: #{vname}};
      out += doT.render({name: #{vname}.name, args: #{vname}.args || arguments}) + '"

tags.xy_render =
  regex: /\{\{\s*@\s*(\S+?)\(([\s\S]*?)\)\s*\}\}/g
  func: (m, tmpl, args) ->
    "' + doT.render( '#{tmpl}' #{if args then ",#{unescape(args)}" else ''} ) + '"

tags.zz_evaluate =
  regex: /\{\{([\s\S]*?)\}\}/g
  func: (m, code) ->
    "'; #{unescape(code)}; out += '"

# mangles definition
mangles = doT.mangles
mangles['05_define'] = resolveDefs = (block, compileParams) ->
  return str unless @use || @define
  c   = @
  def = compileParams.def || {}
  block.toString()
  .replace c.define or skip, (m, code, assign, value) ->
    code = code.substring(4)  if code.indexOf("def.") is 0
    unless code of def
      if assign is ":"
        if c.defineParams
          value.replace c.defineParams, (m, param, v) ->
            def[code] =
              arg: param
              text: v
        def[code] = value  unless code of def
      else
        new Function("def", "def['#{code}'] = #{value}") def
    ''
  .replace c.use or skip, (m, code) ->
    if c.useParams
      code = code.replace(c.useParams, (m, s, d, param) ->
        if def[d] and def[d].arg and param
          rw = (d + ":" + param).replace(/'|\\/g, "_")
          # gtksourceview '
          def.__exp = def.__exp or {}
          def.__exp[rw] = def[d].text.replace(
            new RegExp "(^|[^\\w$])#{def[d].arg}([^\\w$])", "g"
            "$1#{param}$2"
          )
          s + "def.__exp['#{rw}']"
      )
    v = new Function("def", "return " + code)(def)
    if v then resolveDefs.call c, v, compileParams else v

mangles['10_strip'] = (str, compileParams) ->
  return str unless @strip
  str
  .replace( /(^|\r|\n)\t* +| +\t*(\r|\n|$)/g , ' ' )
  .replace( /\r|\n|\t|\/\*[\s\S]*?\*\//g, '' )

mangles['20_escape_quotes'] = (str, compileParams) ->
  str.replace /'|\\/g, '\\$&'
  # gtksourceview '

mangles['50_tags'] = (str, compileParams) ->
  taglist = Object.keys(doT.tags).sort()
  for t_id, t_name of taglist
    str = str.replace doT.tags[ t_name ].regex, ->
      doT.tags[t_name].func.apply compileParams, arguments
  str

mangles['70_escape_spaces'] = (str, compileParams) ->
  str
  .replace( /\n/g, '\\n' )
  .replace( /\t/g, '\\t' )
  .replace( /\r/g, '\\r' )

mangles['80_cleanup'] = (str, compileParams) ->
  str
  .replace( /(\s|;|}|^|{)out\+='';/g, '$1' )
  .replace( /\s*\+\s*''/g, '' )
  .replace( /(\s|;|}|^|{)out\+=''\+/g, '$1out+=' )

mangles['80_function_basics'] = (str, compileParams) ->
  if compileParams.multiple_contents
    "
      var out_stack = [], contents = {}, current_out = '_content';
      var out = '#{str}';
      contents[current_out] = out;
      return contents;
    "
  else
    " var out = '#{str}';
      return out;
    "

mangles['80_with'] = (str, compileParams) ->
  return str unless @with
  "with(#{if true == @with then @varname else @with}) {#{str}}"

mangles['95_functionize'] = (str, compileParams) ->
  try
    new Function @varname, str
  catch e
    throw new Error "#{e} in \"#{str}\""

# template compilation
doT.compile = (tmpl, def) ->
  compile_params = def: def
  mangles_list = Object.keys(doT.mangles).sort()
  for m_id, m_name of mangles_list
    tmpl = doT.mangles[m_name].call doT.templateSettings, tmpl, compile_params
  tmpl

# backward compability
doT.template = doT.compile

# cache functions
doT.getCached = (tmpl) ->
  return cache unless tmpl
  throw new Error "Template not found: #{tmpl}" unless cache[tmpl]
  cache[tmpl]
doT.setCached = (fns) -> cache = fns
doT.exportCached = ->
  str = ""
  str += ",\"#{id}\": #{f.toString()}" for id, f of cache
  "{#{str[1..]}}"
doT.addCached = (id, fn) ->
  if 'object' == typeof id
    for i, f of id
      doT.addCached i, f
    return
  cache[id] = fn

# doT.render() for transparent autoloding & caching
doT.render = (tmpl) ->
  tmpl = name: tmpl unless 'object' == typeof tmpl
  if !cache[tmpl.name]
    src = doT.autoload tmpl.name
    if false == src
      throw new Error "Template not found: #{tmpl.name}"
    doT.addCached tmpl.name, doT.compile src
  cache[tmpl.name].apply this, tmpl.args || Array::slice.call arguments, 1

doT.autoloadDOM = (opts) ->
  (name) ->
    src = document.getElementById name
    return false unless src?.type is 'text/x-dot-tmpl'
    src.innerHTML

doT.autoloadFS = (opts) ->
  (name) ->
    try
      opts.fs.readFileSync "#{opts.root}/#{name.replace('.', '/')}.tmpl"
    catch e
      false

doT.autoloadFail = -> false

doT.autoload = doT.autoloadDOM();
