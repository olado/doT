var assert = require("assert"), doT = require("../doT");

describe('doT', function(){
	var basictemplate = "<div>{{!it.foo}}</div>",
		basiccompiled = doT.template(basictemplate),
		definestemplate = "{{##def.tmp:<div>{{!it.foo}}</div>#}}{{#def.tmp}}",
		definescompiled = doT.template(definestemplate);

	describe('#template()', function(){
		it('should return a function', function(){
		   assert.equal("function", typeof basiccompiled);
		});
	});

	describe('#()', function(){
		it('should render the template', function(){
		   assert.equal("<div>http</div>", basiccompiled({foo:"http"}));
		   assert.equal("<div>http:&#47;&#47;abc.com</div>", basiccompiled({foo:"http://abc.com"}));
		   assert.equal("<div></div>", basiccompiled({}));
		});
	});

	describe('defines', function(){
		it('should render define', function(){
		   assert.equal("<div>http</div>", definescompiled({foo:"http"}));
		   assert.equal("<div>http:&#47;&#47;abc.com</div>", definescompiled({foo:"http://abc.com"}));
		   assert.equal("<div></div>", definescompiled({}));
		});
	});

	describe('defines with parameter', function(){
		var compiledDefinesParamTemplate = function(param){
			var definesparamtemplate = "{{##def.tmp:input:<div>{{!input.foo}}</div>#}}{{#def.tmp:" + param + "}}",
				definesparamcompiled = doT.template(definesparamtemplate);

				return definesparamcompiled;
			};

		it('should render define with standard parameter', function(){
			var definesparamcompiled = compiledDefinesParamTemplate("it");

		   assert.equal(definesparamcompiled({foo:"A"}), "<div>A</div>");
		   assert.equal(definesparamcompiled({}), "<div></div>");
		});

		it('should render define with property parameter', function(){
			var definesparamcompiled = compiledDefinesParamTemplate("it.bar");

		   assert.equal(definesparamcompiled({bar:{foo:"B"}}), "<div>B</div>");
		   assert.throws(function() { definesparamcompiled({}); }, /TypeError: Cannot read property 'foo' of undefined/);
		});

		it('should render define with square bracket property parameter', function(){
			var definesparamcompiled = compiledDefinesParamTemplate("it['bar']");

		   assert.equal(definesparamcompiled({bar:{foo:"C"}}), "<div>C</div>");
		   assert.throws(function() { definesparamcompiled({}); }, /TypeError: Cannot read property 'foo' of undefined/);
		});

		it('should render define with square bracket property with space parameter', function(){
			var definesparamcompiled = compiledDefinesParamTemplate("it['bar baz']");

		   assert.equal(definesparamcompiled({"bar baz":{foo:"D"}}), "<div>D</div>");
		   assert.throws(function() { definesparamcompiled({}); }, /TypeError: Cannot read property 'foo' of undefined/);
		});

		it('should render define with array index property parameter', function(){
			var definesparamcompiled = compiledDefinesParamTemplate("it[1]");

		   assert.equal(definesparamcompiled(["not this", {foo:"E"}, "not this"]), "<div>E</div>");
		   assert.throws(function() { definesparamcompiled({}); }, /TypeError: Cannot read property 'foo' of undefined/);
		});

		it('should render define with deep properties parameter', function(){
			var definesparamcompiled = compiledDefinesParamTemplate("it['bar baz'].qux[1]");

		   assert.equal(definesparamcompiled({"bar baz":{qux:["not this", {foo:"F"}, "not this"]}}), "<div>F</div>");
		   assert.throws(function() { definesparamcompiled({}); }, /TypeError: Cannot read property 'qux' of undefined/);
		});
	});
});
