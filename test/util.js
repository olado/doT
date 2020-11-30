'use strict';

var assert = require('assert')
var doT = require('../doT');

exports.test = function (templates, data, result) {
    templates.forEach(function (tmpl) {
        var fn = doT.template(tmpl);
        assert.strictEqual(fn(data), result);
    });
};

exports.testWithoutContext = function (templates, data, result) {
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

    templates.forEach(function (tmpl) {
        var fn = doT.template(tmpl, settings);
        assert.strictEqual(fn(data), result);
    });
};
