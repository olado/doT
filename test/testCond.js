var assert = require("assert"),
    path = require('path'),
    fs = require('fs'),
    doT = require("../doT");

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
        selfcontained: false,
        alsoNegate: ['false', 'no', 'n']
    };


describe('conditional', function(){
    it('should apply additional negations', function(){
        var data = fs.readFileSync(path.resolve(__dirname, 'bed/cond.html'));
        var templateFn = doT.template(data.toString());
        var out1 = templateFn({'hasLiveReload': "false"});
        assert.equal(out1.indexOf('<script id="live-reload">'), -1);
        var out2 = templateFn({'hasLiveReload': false});
        assert.equal(out2.indexOf('<script id="live-reload">'), -1);
        var out3 = templateFn({'hasLiveReload': "no"});
        assert.equal(out3.indexOf('<script id="live-reload">'), -1);
        var out4 = templateFn({'hasLiveReload': "n"});
        assert.equal(out4.indexOf('<script id="live-reload">'), -1);
        var out5 = templateFn({'hasLiveReload': "yes"});
        assert.notEqual(out5.indexOf('<script id="live-reload">'), -1);
    });
});