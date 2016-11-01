'use strict';

var test = require('./util').test;
var assert = require("assert")
var doT = require("../doT");


describe('doT', function(){
	var basictemplate = "<div>{{!it.foo}}</div>",
		basiccompiled = doT.template(basictemplate),
		definestemplate = "{{##def.tmp:<div>{{!it.foo}}</div>#}}{{#def.tmp}}",
		definescompiled = doT.template(definestemplate);

	describe('#template()', function(){
		it('should return a function', function(){
			assert.equal(typeof basiccompiled, "function");
		});
	});

	describe('#()', function(){
		it('should render the template', function(){
			assert.equal(basiccompiled({foo:"http"}), "<div>http</div>");
			assert.equal(basiccompiled({foo:"http://abc.com"}), "<div>http:&#47;&#47;abc.com</div>");
			assert.equal(basiccompiled({}), "<div></div>");
		});
	});

	describe('defines', function(){
		it('should render define', function(){
			assert.equal(definescompiled({foo:"http"}), "<div>http</div>");
			assert.equal(definescompiled({foo:"http://abc.com"}), "<div>http:&#47;&#47;abc.com</div>");
			assert.equal(definescompiled({}), "<div></div>");
		});
	});

	describe('encoding with doNotSkipEncoded=false', function() {
		it('should not replace &', function() {
			global._encodeHTML = undefined;
			doT.templateSettings.doNotSkipEncoded = false;
			assert.equal(doT.template(definestemplate)({foo:"&amp;"}), "<div>&amp;</div>");
		});
	});

	describe('evaluate 2 numbers', function() {
		it('should print numbers next to each other', function() {
			test([
				'{{=it.one}}{{=it.two}}',
				'{{= it.one}}{{= it.two}}',
				'{{= it.one }}{{= it.two }}'
			], {one:1, two: 2}, '12');
		});
	});

	describe('encoding with doNotSkipEncoded=true', function() {
		it('should replace &', function() {
			global._encodeHTML = undefined;
			doT.templateSettings.doNotSkipEncoded = true;
			assert.equal(doT.template(definestemplate)({foo:"&amp;"}), "<div>&#38;amp;</div>");
			assert.equal(doT.template('{{!it.a}}')({a:"& < > / ' \""}), "&#38; &#60; &#62; &#47; &#39; &#34;");
			assert.equal(doT.template('{{!"& < > / \' \\""}}')(), "&#38; &#60; &#62; &#47; &#39; &#34;");

		});
	});

});
