###
  doT.js
  2011, Laura Doktorova, https://github.com/olado/doT
  
  doT.js is an open source component of http://bebedo.com
  Licensed under the MIT license.
###
'use strict'

DotCore   = require './DotCore'
settings  = require './settings/original'
doT = new DotCore settings

# register in global scope
if module?.exports
  module.exports = doT
else if define?.amd
  define -> doT
else
  @doT = doT
