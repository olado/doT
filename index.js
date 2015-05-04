/* doT + auto-compilation of doT templates
 *
 * 2012, Laura Doktorova, https://github.com/olado/doT
 * Licensed under the MIT license
 *
 * Compiles .def, .dot, .jst files found under the specified path.
 * It ignores sub-directories.
 * Template files can have multiple extensions at the same time.
 * Files with .def extension can be included in other files via {{#def.name}}
 * Files with .dot extension are compiled into functions with the same name and
 * can be accessed as renderer.filename
 * Files with .jst extension are compiled into .js files. Produced .js file can be
 * loaded as a commonJS, AMD module, or just installed into a global variable
 * (default is set to window.render).
 * All inline defines defined in the .jst file are
 * compiled into separate functions and are available via _render.filename.definename
 *
 * Basic usage:
 * var dots = require("dot").process({path: "./views"});
 * dots.mytemplate({foo:"hello world"});
 *
 * The above snippet will:
 * 1. Compile all templates in views folder (.dot, .def, .jst)
 * 2. Place .js files compiled from .jst templates into the same folder.
 *    These files can be used with require, i.e. require("./views/mytemplate").
 * 3. Return an object with functions compiled from .dot templates as its properties.
 * 4. Render mytemplate template.
 */

var fs = require("fs"),
    path = require("path"),
    doT = module.exports = require("./doT");

doT.process = function(options) {
    //path, destination, global, rendermodule, templateSettings
    return new InstallDots(options).compileAll();
};

function InstallDots(o) {
    this.__global = o.global || "window.render";
    this.__rendermodule = o.rendermodule || {};
    this.__settings = o.templateSettings ? copy(o.templateSettings, copy(doT.templateSettings)) : undefined;
    this.__includes = {};
    this.__subDirectories = o.subDirectories || false;
    this.__path = o.path ? [o.path] : ["./"];
    if (this.__path[0][this.__path[0].length - 1] !== '/') {
        this.__path[0] += '/';
    }
    this.__destination = o.destination || this.__path[0];
    if (this.__destination[this.__destination.length - 1] !== '/') {
        this.__destination += '/';
    }

    if (this.__subDirectories) {
        this.__path = getDirs(this.__path[0]);
    }
}

InstallDots.prototype.compileToFile = function(path, template, def) {
    def = def || {};
    var modulename = path.substring(path.lastIndexOf("/") + 1, path.lastIndexOf(".")),
        defs = copy(this.__includes, copy(def)),
        settings = this.__settings || doT.templateSettings,
        compileoptions = copy(settings),
        defaultcompiled = doT.template(template, settings, defs),
        exports = [],
        compiled = "",
        fn;

    for (var property in defs) {
        if (defs[property] !== def[property] && defs[property] !== this.__includes[property]) {
            fn = undefined;
            if (typeof defs[property] === 'string') {
                fn = doT.template(defs[property], settings, defs);
            } else if (typeof defs[property] === 'function') {
                fn = defs[property];
            } else if (defs[property].arg) {
                compileoptions.varname = defs[property].arg;
                fn = doT.template(defs[property].text, compileoptions, defs);
            }
            if (fn) {
                compiled += fn.toString().replace('anonymous', property);
                exports.push(property);
            }
        }
    }
    compiled += defaultcompiled.toString().replace('anonymous', modulename);
    fs.writeFileSync(path, "(function(){" + compiled + "var itself=" + modulename + ", _encodeHTML=(" + doT.encodeHTMLSource.toString() + "(" + (settings.doNotSkipEncoded || '') + "));" + addexports(exports) + "if(typeof module!=='undefined' && module.exports) module.exports=itself;else if(typeof define==='function')define(function(){return itself;});else {" + this.__global + "=" + this.__global + "||{};" + this.__global + "['" + modulename + "']=itself;}}());");
};

InstallDots.prototype.compilePath = function(path) {
    var data = readdata(path);
    if (data) {
        return doT.template(data,
            this.__settings || doT.templateSettings,
            copy(this.__includes));
    }
};

// Has to be done in two loops, so .def files from subdirectories
// get discovered, before compiling the .dot and .jst files
InstallDots.prototype.compileAll = function() {
    console.log("Compiling all doT templates...");

    var k, l, name,
        dirIndex, defFolder, sources,
        totalTemplates = 0;

    for (dirIndex = 0; dirIndex < this.__path.length; dirIndex++) {
        defFolder = this.__path[dirIndex];
        sources = fs.readdirSync(defFolder);

        for (k = 0, l = sources.length; k < l; k++) {
            name = sources[k];

            if (/\.def(\.dot|\.jst)?$/.test(name)) {
                console.log("Loaded def " + name);
                this.__includes[name.substring(0, name.indexOf('.'))] = readdata(defFolder + name);
                totalTemplates++;
            }
        }
    }

    for (dirIndex = 0; dirIndex < this.__path.length; dirIndex++) {
        defFolder = this.__path[dirIndex];
        sources = fs.readdirSync(defFolder);

        for (k = 0, l = sources.length; k < l; k++) {
            name = sources[k];

            if (/\.dot(\.def|\.jst)?$/.test(name)) {
                console.log("Compiling " + name + " to function");
                this.__rendermodule[name.substring(0, name.indexOf('.'))] = this.compilePath(defFolder + name);
                totalTemplates++;
            }

            if (/\.jst(\.dot|\.def)?$/.test(name)) {
                console.log("Compiling " + name + " to file");
                this.compileToFile(this.__destination + name.substring(0, name.indexOf('.')) + '.js',
                    readdata(defFolder + name));
                totalTemplates++;
            }
        }
    }

    console.log("Finished compiling %d templates", totalTemplates);
    return this.__rendermodule;
};

function addexports(exports) {
    for (var ret = '', i = 0; i < exports.length; i++) {
        ret += "itself." + exports[i] + "=" + exports[i] + ";";
    }
    return ret;
}

function copy(o, to) {
    to = to || {};
    for (var property in o) {
        to[property] = o[property];
    }
    return to;
}

function readdata(path) {
    var data = fs.readFileSync(path);
    if (data) return data.toString();
    console.log("problems with " + path);
}

function getDirs(dir) {
    var dirs = walk(dir);

    return addEndSeparator(dirs);
}

function walk(dir) {
    var results = [path.resolve(dir)],
        list = fs.readdirSync(dir);

    list.forEach(function(file) {
        file = path.resolve(dir, file);
        var stat = fs.statSync(file);

        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        }
    });

    return results;
}

function addEndSeparator(dirs) {
    dirs.forEach(function(element, index, array) {
        array[index] = element + path.sep;
    });

    return dirs;
}
