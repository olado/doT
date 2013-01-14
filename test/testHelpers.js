var assert = require("assert"), doT = require("../doT");

describe('doT Helpers', function(){
    var basictemplate = "<div>{{@capitalize it.name}}</div>",
        basiccompiled = null,
        uppercaseTemplate = "<div>{{@uppercase it.name}}</div>",
        uppercaseCompiled = null,
        uppercase = function(val){ return val.toUpperCase(); },
        capitalize = function(val){ return val.charAt(0).toUpperCase() + val.slice(1);};

    // register helpers
    doT.registerHelper('capitalize', capitalize);
    doT.registerHelper('uppercase', uppercase);

    basiccompiled = doT.template(basictemplate);
    uppercaseCompiled = doT.template(uppercaseTemplate);

    describe('register helper', function(){
        it('should register', function(){
            assert.equal("function", typeof doT.helpers['capitalize']);
            assert.equal("function", typeof doT.helpers['uppercase']);
        });
    });

    describe('#template()', function(){
        it('should return a function', function(){
           assert.equal("function", typeof basiccompiled);
        });
        it('should work with capitalize fn helper', function(){
            assert.equal('<div>Nick</div>', basiccompiled({'name': 'nick'}));
        });
        it('should work with uppercase fn helper', function(){
            assert.equal('<div>NICK</div>', uppercaseCompiled({'name': 'nick'}));
            assert.equal('<div>NICK JONAS</div>', uppercaseCompiled({'name': 'nick jonas'}));
        });
    });
});
