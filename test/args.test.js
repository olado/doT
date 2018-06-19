'use strict';

var test = require('./util').test;
var assert = require("assert")
var doT = require("../doT");


describe('destructuring args declaration', function() {
	it('should print numbers next to each other', function() {
		test([
			'{{@one,two}}{{=one}}{{=two}}',
			'{{@one,two}}{{= one}}{{= two}}',
			'{{@one,two}}{{= one }}{{= two }}'
		], {one:1, two: 2}, '12');
		test([
			'{{@ one, two=2 }}{{=one}}{{=two}}',
		], {one:1}, '12');
	});
});
