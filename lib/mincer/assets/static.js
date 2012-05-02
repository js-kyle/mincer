'use strict';


// stdlib
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');


// 3rd-party
var mkdirp = require('mkdirp');


// internal
var prop    = require('../common').prop;
var getter  = require('../common').getter;
var Asset   = require('./asset');


var StaticAsset = module.exports = function StaticAsset() {
  Asset.apply(this, arguments);
};


require('util').inherits(StaticAsset, Asset);


/**
 *  StaticAsset#buffer -> String
 **/
getter(StaticAsset.prototype, 'buffer', function () {
  return fs.readFileSync(this.pathname);
});


/**
 *  StaticAsset#source -> String
 **/
getter(StaticAsset.prototype, 'source', function () {
  return this.buffer.toString();
});


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

  mkdirp(path.dirname(filename), function (err) {
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
