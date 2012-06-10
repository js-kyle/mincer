/** internal
 *  class StaticAsset
 *
 *  Represents static asset the one that has no any processors associated with.
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Asset]]
 **/


'use strict';


// stdlib
var fs    = require('fs');
var path  = require('path');
var zlib  = require('zlib');


// 3rd-party
var async   = require('async');
var fstools = require('fs-tools');


// internal
var prop    = require('../common').prop;
var getter  = require('../common').getter;
var Asset   = require('./asset');


////////////////////////////////////////////////////////////////////////////////


/**
 *  new StaticAsset()
 *
 *  See [[Asset.new]] for details.
 **/
var StaticAsset = module.exports = function StaticAsset() {
  Asset.apply(this, arguments);
  prop(this, 'type', 'static');
};


require('util').inherits(StaticAsset, Asset);


// See apidoc of [[Asset#buffer]]
getter(StaticAsset.prototype, 'buffer', function () {
  // No caching to avoid memory bloating by default.
  // Caching might be implemented on the higher level (e.g. in [[Server]])
  // by simply setting `__buffer__` property.
  return this.__buffer__ || fs.readFileSync(this.pathname);
});


// See apidoc of [[Asset#source]]
getter(StaticAsset.prototype, 'source', function () {
  return this.buffer.toString('binary');
});


// simple (no compression) or gzipped writer handler
var copier = {
  simple: function (from, to, callback) {
    fstools.copy(from, to, callback);
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


// See apidoc of [[Asset#writeTo]].
// Overridden writer logic.
StaticAsset.prototype.writeTo = function (filename, options, callback) {
  var mtime    = this.mtime,
      pathname = this.pathname,
      tempname = filename + "+",
      copy_fn;

  options = options || {};

  if (!callback) {
    callback  = options;
    options   = {};
  }

  if (undefined === options.compress && '.gz' === path.extname(filename)) {
    options.compress = true;
  }

  copy_fn = copier[options.compress ? 'gzipped' : 'simple'];

  async.series([
    function (next) { fstools.mkdir(path.dirname(filename), next); },
    function (next) { copy_fn(pathname, tempname, next); },
    function (next) { fs.rename(tempname, filename, next); },
    function (next) { fs.utimes(filename, mtime, mtime, next); },
    function (next) { fstools.remove(tempname, next); }
  ], callback);
};


// See [[Asset#isCompiled]] documentation
getter(StaticAsset.prototype, 'isCompiled', function () {
  return true;
});
