'use strict';


// stdlib
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');


// 3rd-party
var fstools = require('fs-tools');


// internal
var prop    = require('./common').prop;
var getter  = require('./common').getter;
var Asset   = require('./asset');


var copier = {
  simple: function (from, to, callback) {
    fs.copy(from, to, callback);
  },

  gzipped: function (from, to, callback) {
    var gzip, input, output;

    gzip    = zlib.createGzip();
    input   = fs.createReadStream(from);
    output  = fs.createWriteStream(to);

    output.on('close', callback);

    input.pipe(gzip).pipe(output);
  }
};


var StaticAsset = module.exports = function StaticAsset() {
  Asset.apply(this, arguments);
};


require('util').inherits(StaticAsset, Asset);


getter(StaticAsset.prototype, 'source', function () {
  // File is read everytime to avoid memory bloat of large binary files
  return fs.readFileSync(this.pathname, 'utf8');
});


StaticAsset.prototype.writeTo = function (filename, options, callback) {
  var mtime = this.mtime, pathname = this.pathname, tempname = filename + "+";

  options = options || {};

  if (!callback) {
    callback  = options;
    options   = {};
  }

  if (undefined === options.compress && '.gz' === path.extname(filename)) {
    options.compress = true;
  }

  fstools.mkdir(path.dirname(filename), function (err) {
    if (err) {
      callback(err);
      return;
    }

    copier[options.compress ? 'gzipped' : 'simple'](pathname, tempname, function (err) {
      if (err) {
        callback(err);
        return;
      }

      try {
        fs.renameSync(tempname, filename);
        fs.utimesSync(filename, mtime, mtime);

        if (path.existsSync(tempname)) {
          fs.rmdirSync(tempname);
        }

        callback();
      } catch (err) {
        callback(err);
      }
    });
  });
};
