'use strict';

var test = require('./util').testWithoutContext;
var assert = require("assert")
var doT = require("..");

var settings = {
  evaluate:    /\{\{([\s\S]+?(\}?)+)\}\}/g,
  interpolate: /\{\{=([\s\S]+?)\}\}/g,
  encode:      /\{\{!([\s\S]+?)\}\}/g,
  use:         /\{\{#([\s\S]+?)\}\}/g,
  useParams:   /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
  define:      /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
  defineParams:/^\s*([\w$]+):([\s\S]+)/,
  conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
  iterate:     /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
  varname:	"",
  strip:		true,
  append:		true,
  selfcontained: false,
  doNotSkipEncoded: false
};

describe('noContext', function(){
  describe('evaluate JavaScript', function() {
    it('should print numbers next to each other', function() {
      test([
        '{{ one = 1; two = 2; }}{{= one }}{{= two }}',
      ], {}, '12');
    });
  });

  describe('interpolate 2 numbers', function() {
    it('should print numbers next to each other', function() {
      test([
        '{{=one}}{{=two}}',
        '{{= one}}{{= two}}',
        '{{= one }}{{= two }}'
      ], {one:1, two: 2}, '12');
    });
  });

  describe('encoding with doNotSkipEncoded=false', function() {
    it('should not replace &', function() {
      global._encodeHTML = undefined;
      doT.templateSettings.doNotSkipEncoded = false;
      var fn = doT.template('<div>{{!foo}}</div>', settings);
      assert.equal(fn({foo:"&amp;"}), "<div>&amp;</div>");
    });
  });

  describe('encoding with doNotSkipEncoded=true', function() {
    it('should replace &', function() {
      global._encodeHTML = undefined;
      settings.doNotSkipEncoded = true;
      assert.equal(doT.template('<div>{{!foo}}</div>', settings)({foo:"&amp;"}), "<div>&#38;amp;</div>");
      assert.equal(doT.template('{{!a}}', settings)({a:"& < > / ' \""}), "&#38; &#60; &#62; &#47; &#39; &#34;");
      assert.equal(doT.template('{{!"& < > / \' \\""}}')(), "&#38; &#60; &#62; &#47; &#39; &#34;");
    });
  });

  describe('invalid JS in templates', function() {
    it('should throw exception', function() {
      assert.throws(function() {
        var fn = doT.template('<div>{{= foo + }}</div>', settings)();
      });
    });
  });

  describe('conditionals', function() {
    describe('without else', function() {
      var templates = [
        '{{?one < 2}}{{=one}}{{?}}{{=two}}',
        '{{? one < 2 }}{{= one }}{{?}}{{= two }}'
      ];

      it('should evaluate condition and include template if valid', function() {
        test(templates, {one: 1, two: 2}, '12')
      });

      it('should evaluate condition and do NOT include template if invalid', function() {
        test(templates, {one: 3, two: 2}, '2')
      });
    });


    describe('with else', function() {
      var templates = [
        '{{?one < 2}}{{=one}}{{??}}{{=two}}{{?}}',
        '{{? one < 2 }}{{= one }}{{??}}{{= two }}{{?}}'
      ];

      it('should evaluate condition and include "if" template if valid', function() {
        test(templates, {one: 1, two: 2}, '1')
      });

      it('should evaluate condition and include "else" template if invalid', function() {
        test(templates, {one: 3, two: 2}, '2')
      });
    });

    describe('with else if', function() {
      var templates = [
        '{{?one < 2}}{{=one}}{{??two < 3}}{{=two}}{{??}}{{=three}}{{?}}',
        '{{? one < 2 }}{{= one }}{{?? two < 3 }}{{= two }}{{??}}{{= three }}{{?}}'
      ];

      it('should evaluate condition and include "if" template if valid', function() {
        test(templates, {one: 1, two: 2, three: 3}, '1')
      });

      it('should evaluate condition and include "else if" template if second condition valid', function() {
        test(templates, {one: 10, two: 2, three: 3}, '2')
      });

      it('should evaluate condition and include "else" template if invalid', function() {
        test(templates, {one: 10, two: 20, three: 3}, '3')
      });
    });
  });

  describe('iteration', function() {
    describe('without index', function() {
      it('should repeat string N times', function() {
        test([
          '{{~arr:x}}*{{~}}',
          '{{~ arr:x }}*{{~}}',
          '{{~ arr: x }}*{{~}}',
          '{{~ arr :x }}*{{~}}'
        ], {arr: Array(3)}, '***');
      });

      it('should concatenate items', function() {
        test(['{{~arr:x}}{{=x}}{{~}}'], {arr: [1,2,3]}, '123');
      });
    });

    describe('with index', function() {
      it('should repeat string N times', function() {
        test([
          '{{~arr:x:i}}*{{~}}',
          '{{~ arr : x : i }}*{{~}}'
        ], {arr: Array(3)}, '***');
      });

      it('should concatenate indices', function() {
        test(['{{~arr:x:i}}{{=i}}{{~}}'], {arr: Array(3)}, '012');
      });

      it('should concatenate indices and items', function() {
        test([
          '{{~arr:x:i}}{{?i}}, {{?}}{{=i}}:{{=x}}{{~}}'
        ], {arr: [10,20,30]}, '0:10, 1:20, 2:30');
      });
    });
  });
})
