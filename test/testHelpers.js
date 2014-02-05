var assert = require("assert"),
    path = require('path'),
    fs = require('fs'),
    doT = require("../doT");

describe('doT Helpers', function(){
    var basictemplate = "<div><%@capitalize it.name%></div>",
        basiccompiled = null,
        uppercaseTemplate = "<div><%@uppercase it.name%></div>",
        uppercaseCompiled = null,
        uppercase = function(val){ return val.toUpperCase(); },
        capitalize = function(val){ return val.charAt(0).toUpperCase() + val.slice(1);},
        sanitizeClassName = function(name){
            var sName = name,
                allWords = sName.split(/\s+/g),
                i = 0;
            for(i; i < allWords.length; i++){
                allWords[i] = allWords[i].charAt(0).toUpperCase() + allWords[i].slice(1);
            }
            sName = allWords.join('').trim();

            return sName;
        };

    doT.templateSettings = {
        evaluate:    /\<\%([\s\S]+?)\%\>/g,
        interpolate: /\<\%=([\s\S]+?)\%\>/g,
        encode:      /\<\%!([\s\S]+?)\%\>/g,
        helper:      /\<\%@([\s\S]+?)\%\>/g,
        use:         /\<\%#([\s\S]+?)\%\>/g,
        define:      /\<\%##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\%\>/g,
        conditional: /\<\%\?(\?)?\s*([\s\S]*?)\s*\%\>/g,
        iterate:     /\<\%~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\%\>)/g,
        varname: 'it',
        strip: false,
        append: true,
        selfcontained: false
    };

    // register helpers
    doT.registerHelper('capitalize', capitalize);
    doT.registerHelper('uppercase', uppercase);
    doT.registerHelper('className', sanitizeClassName);

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
            var test = basiccompiled({'name': 'nick'});
            assert.equal('<div>Nick</div>', basiccompiled({'name': 'nick'}));
        });
        it('should work with uppercase fn helper', function(){
            assert.equal('<div>NICK</div>', uppercaseCompiled({'name': 'nick'}));
            assert.equal('<div>NICK JONAS</div>', uppercaseCompiled({'name': 'nick jonas'}));
        });
    });

    describe('external file template', function(){
        it('should correctly template with helper', function(){
            var file = fs.readFileSync(path.join(__dirname, 'bed/.test')),
                template = file.toString(),
                compiled = doT.template(template);
           assert.equal("function", typeof compiled);
           var out = compiled({'name': 'nick jonas'});
           assert.notEqual(out.indexOf('NickJonasView.js'), -1);
           assert.notEqual(out.indexOf('_NickJonas.scss'), -1);
           assert.notEqual(out.indexOf('NickJonas_template.html'), -1);
        });
    });

    describe('external file template', function(){
        it('should correctly template with helper', function(){
            var file = fs.readFileSync(path.join(__dirname, 'bed/test.js')),
                template = file.toString(),
                compiled = doT.template(template);
           assert.equal("function", typeof compiled);
           var out = compiled({'name': 'nick jonas'});
        });
    });

doT.templateSettings = {
        evaluate:    /\<\%([\s\S]+?)\%\>/g,
        interpolate: /\<\%=([\s\S]+?)\%\>/g,
        encode:      /\<\%!([\s\S]+?)\%\>/g,
        helper:      /\<\%@([\s\S]+?)\%\>/g,
        use:         /\<\%#([\s\S]+?)\%\>/g,
        define:      /\<\%##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\%\>/g,
        conditional: /\<\%\?(\?)?\s*([\s\S]*?)\s*\%\>/g,
        iterate:     /\<\%~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\%\>)/g,
        varname: 'it',
        strip: false,
        append: true,
        selfcontained: false
    };

    describe('external file template', function(){
        it('should correctly template with helper', function(){
            var file = fs.readFileSync(path.join(__dirname, 'bed/interpolate.html')),
                template = file.toString(),
                compiled = doT.template(template);
           assert.equal("function", typeof compiled);
           var out = compiled({'name': 'nick jonas', 'description': 'heyo!'});

        });
    });
});
