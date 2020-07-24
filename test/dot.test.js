'use strict';

var test = require('./util').test;
var assert = require("assert")
var doT = require("..");


describe('doT', function(){
	var basictemplate = "<div>{{=it.foo}}</div>";
	var basiccompiled = doT.template(basictemplate);

	describe('#template()', function(){
		it('should return a function', function(){
			assert.equal(typeof basiccompiled, "function");
		});
	});

	describe('#()', function(){
		it('should render the template', function(){
			assert.equal(basiccompiled({foo:"http"}), "<div>http</div>");
			assert.equal(basiccompiled({foo:"http://abc.com"}), "<div>http://abc.com</div>");
			assert.equal(basiccompiled({}), "<div>undefined</div>");
		});
	});

	describe('encoding with doNotSkipEncoded=false', function() {
		it('should not replace &', function() {
			var fn = doT.template('<div>{{=it.foo}}</div>');
			assert.equal(fn({foo:"&amp;"}), "<div>&amp;</div>");
		});
	});

	describe('interpolate 2 numbers', function() {
		it('should print numbers next to each other', function() {
			test([
				'{{=it.one}}{{=it.two}}',
				'{{= it.one}}{{= it.two}}',
				'{{= it.one }}{{= it.two }}'
			], {one:1, two: 2}, '12');
		});
	});

	describe('type-safe interpolation', () => {
		it('should interpolate correct types', () => {
			test([
				'{{%n=it.num}}-{{%s=it.str}}-{{%b=it.bool}}',
				'{{%n= it.num}}-{{%s= it.str}}-{{%b= it.bool}}',
				'{{%n= it.num }}-{{%s= it.str }}-{{%b= it.bool }}'
			], {num: 1, str: 'foo', bool: true}, '1-foo-true')
		})

		it('should throw on incorrect data types', () => {
			const numTmpl = doT.template('{{%n=it.num}}')
			assert.strictEqual(numTmpl({num: 1}), '1')
			assert.throws(() => numTmpl({num: "1"}))
			assert.throws(() => numTmpl({num: true}))

			const strTmpl = doT.template('{{%s=it.str}}')
			assert.strictEqual(strTmpl({str: "foo"}), 'foo')
			assert.throws(() => strTmpl({str: 1}))
			assert.throws(() => strTmpl({str: true}))

			const boolTmpl = doT.template('{{%b=it.bool}}')
			assert.strictEqual(boolTmpl({bool: true}), 'true')
			assert.throws(() => boolTmpl({bool: "true"}))
			assert.throws(() => boolTmpl({bool: 1}))
		})
	})

	describe('evaluate JavaScript', function() {
		it('should print numbers next to each other', function() {
			test([
				'{{ it.one = 1; it.two = 2; }}{{= it.one }}{{= it.two }}',
			], {}, '12');
		});
	});

	describe('no HTML encoding', function() {
		it('should NOT replace &', function() {
			assert.equal(doT.template('<div>{{=it.foo}}</div>')({foo:"&amp;"}), "<div>&amp;</div>");
			assert.equal(doT.template('{{=it.a}}')({a:"& < > / ' \""}), "& < > / ' \"");
			assert.equal(doT.template('{{="& < > / \' \\""}}')(), "& < > / \' \"");
		});
	});

	describe('invalid JS in templates', function() {
		it('should throw exception', function() {
			assert.throws(function() {
				var fn = doT.template('<div>{{= foo + }}</div>');
			});
		});
	});
});
