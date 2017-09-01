'use strict';

var mockfs = require("mock-fs");
var assert = require("assert")
var doT = require("../index");
doT.log = false;

describe('index', function() {
    describe('process', function() {
        it('should preserve filenames', function() {
            mockfs({
                './mock-fs': {
                    'foo.dot': '<html>{{= bar }}</html>',
                    'foo.bar.dot': '<xml>{{= bar }}</xml>',
                    'bar.def': 'included',
                    'baz.jst': 'function(){}'
                }
            });

            var compiled = doT.process({
                'path': './mock-fs'
            });

            mockfs.restore();

            assert.equal(typeof compiled.foo, 'function');
            assert.equal(typeof compiled['foo.bar'], 'function');
        });
    });
});
