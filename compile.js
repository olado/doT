// Generated by CoffeeScript 1.4.0
(function() {

  module.exports = function(data, finalcb) {
    var any_error, child, doT, flow, fs, path, readFile, readItem;
    fs = require('fs');
    path = require('path');
    flow = require('flow');
    doT = require('./doT.js');
    child = require('child_process');
    any_error = function(results) {
      var r, _i, _len;
      for (_i = 0, _len = results.length; _i < _len; _i++) {
        r = results[_i];
        if (r[0]) {
          return r[0];
        }
      }
      return null;
    };
    readItem = function(item, callback) {
      return flow.exec(function() {
        return fs.stat(item, this);
      }, function(err, stat) {
        var item_cb;
        if (err) {
          return this(err);
        }
        if (!stat.isDirectory()) {
          return readFile(item, this);
        }
        item_cb = this;
        return flow.exec(function() {
          return fs.readdir(item, this);
        }, function(err, files) {
          var _this = this;
          if (err) {
            return this.MULTI(err);
          }
          return files.forEach(function(file) {
            return readItem(path.join(item, file), _this.MULTI());
          });
        }, function(results) {
          return item_cb(any_error(results));
        });
      }, function(err) {
        return callback(err);
      });
    };
    readFile = function(file, callback) {
      return flow.exec(function() {
        if (file.match(/.haml$/)) {
          child.exec("haml '" + file + "'", this);
          return file = path.basename(file, '.haml');
        } else {
          return fs.readFile(file, this);
        }
      }, function(err, text) {
        var dot_err, f, id, rel;
        if (err) {
          return this(err);
        }
        id = path.basename(file, path.extname(file));
        if (data.base) {
          rel = path.relative(data.base, path.dirname(file)).replace(/\//g, '.');
          if (rel) {
            id = "" + rel + "." + id;
          }
        }
        f = dot_err = null;
        try {
          f = doT.compile(text);
          doT.addCached(id, f);
        } catch (e) {
          dot_err = e;
        }
        return this(dot_err, f);
      }, function(err, f) {
        return callback(err, f);
      });
    };
    return flow.exec(function() {
      var _this = this;
      return data.files.forEach(function(val, i) {
        return readItem(val, _this.MULTI());
      });
    }, function(results) {
      if (!finalcb) {
        return;
      }
      return finalcb(any_error(results), doT.exportCached());
    });
  };

}).call(this);
