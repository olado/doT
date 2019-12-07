'use strict';

var assert = require('assert');
var doT = require('..');


describe('doT.process', function() {
	describe('polluting object prototype should not affect template compilation', function() {
		it('should ignore varname on object prototype', function() {
      var currentLog = console.log;
      console.log = log;
      var logged;
      
			Object.prototype.templateSettings = {varname: 'it=(console.log("executed"),{})'};

      try {
        const templates = doT.process({path: './test'});
        assert.notEqual(logged, 'executed');
        // injected code can only be executed if undefined is passed to template function
        templates.test();
        assert.notEqual(logged, 'executed');
      } finally {
        console.log = currentLog;
      }
      
      function log(str) {
        logged = str;
      }
		})
	});
});
