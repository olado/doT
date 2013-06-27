settings =
  mangles:      mangles = {}
  tags:         tags    = {}
  varname:      'it'
  strip:        true
  with:         true
  dynamicList:  'it._dynamic'
  startend:
    start:      "' + ("
    end:        ") + '"
    endEncode:  ").encodeHTML() + '"

if module?.exports
  module.exports = settings
else if define?.amd
  define -> settings
else if window?.DotCore
  (DotCore.settings ||= {}).original = settings

sid   = 0 # sequental id for variable names
re_skip  = /$^/

unless String::encodeHTML
  do ->
    rules =  "&": "&#38;", "<": "&#60;", ">": "&#62;", '"': '&#34;', "'": '&#39;', "/": '&#47;'
    match = /&(?!#?\w+;)|<|>|"|'|\//g
    String::encodeHTML = -> @replace match, (m) -> rules[m] || m

settings.unescape = unescape = (code) ->
  code.replace(/\\('|\\)/g, '$1').replace /[\r\t\n]/g, ' '

# tags definition
tags.interpolate =
  regex: /\{\{\s*=([\s\S]*?)\}\}/g
  func: (m, code) ->
    cse = @doT.startend
    cse.start + unescape(code) + cse.end

tags.encode =
  regex: /\{\{\s*!([\s\S]*?)\}\}/g
  func: (m, code) ->
    cse = @doT.startend
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
      var #{vname} = #{@doT.dynamicList}[ '#{unescape(tmpl)}' ];
      if ('string' === typeof #{vname}) #{vname} = {name: #{vname}};
      out += this.render({name: #{vname}.name, args: #{vname}.args || arguments}) + '"

tags.xy_render =
  regex: /\{\{\s*@\s*(\S+?)\(([\s\S]*?)\)\s*\}\}/g
  func: (m, tmpl, args) ->
    "' + this.render( '#{tmpl}' #{if args then ",#{unescape(args)}" else ''} ) + '"

tags.zz_evaluate =
  regex: /\{\{([\s\S]*?)\}\}/g
  func: (m, code) ->
    "'; #{unescape(code)}; out += '"

# mangles definition
mangles['05_define'] = settings.resolveDefs = resolveDefs = (block, compileParams) ->
  return str unless resolveDefs.use || resolveDefs.define
  c   = @
  def = compileParams.def || {}
  block.toString()
  .replace resolveDefs.define or re_skip, (m, code, assign, value) ->
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
  .replace resolveDefs.use or re_skip, (m, code) ->
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

resolveDefs.use     = /\{\{#([\s\S]+?)\}\}/g
resolveDefs.define  = /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g

mangles['10_strip'] = (str, compileParams) ->
  return str unless @doT.strip
  str
  .replace(/(^|\r|\n)\t* +| +\t*(\r|\n|$)/g , ' ')
  .replace(/\r|\n|\t|\/\*[\s\S]*?\*\//g, '')

mangles['20_escape_quotes'] = (str, compileParams) ->
  str.replace /'|\\/g, '\\$&'
  # gtksourceview '

mangles['50_tags'] = (str, compileParams) ->
  taglist = Object.keys(@doT.tags).sort()
  for t_id, t_name of taglist
    tag = @doT.tags[t_name]
    str = str.replace tag.regex, ->
      tag.func.apply compileParams, arguments
  str

mangles['70_escape_spaces'] = (str, compileParams) ->
  str
  .replace(/\n/g, '\\n')
  .replace(/\t/g, '\\t')
  .replace(/\r/g, '\\r')

mangles['80_cleanup'] = (str, compileParams) ->
  str
  .replace(/(\s|;|}|^|{)out\+='';/g, '$1')
  .replace(/\s*\+\s*''/g, '')
  .replace(/(\s|;|}|^|{)out\+=''\+/g, '$1out+=')

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
  return str unless @doT.with
  "with(#{if true == @doT.with then @doT.varname else @doT.with}) {#{str}}"

mangles['95_functionize'] = (str, compileParams) ->
  try
    new Function @doT.varname, str
  catch e
    throw new Error "#{e} in `new Function '#{@varname}', \"#{str}\"`"
