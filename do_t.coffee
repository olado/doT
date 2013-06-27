if module?.exports
  DotCore   = require './dot_core'
  settings  = require './settings/original'
  module.exports = doT = new DotCore settings
else if (DotCore = window?.DotCore)?.settings?.original
  window.doT = new DotCore DotCore.settings.original
