/**
 *  class Asset
 *
 *  The base class for [[BundledAsset]] and [[StaticAsset]].
 **/


'use strict';


// stdlib
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');


// 3rd-party
var mkdirp = require('mkdirp');


// internal
var prop = require('./common').prop;
var getter = require('./common').getter;


var Asset = module.exports = function Asset(environment, logical_path, pathname) {
  prop(this, 'root',          environment.root);
  prop(this, 'logical_path',  logical_path);
  prop(this, 'pathname',      pathname);
  prop(this, 'content_type',  environment.contentTypeOf(pathname));
  prop(this, 'mtime',         environment.stat(pathname).mtime);
  prop(this, 'length',        environment.stat(pathname).size);
  prop(this, 'digest',        environment.fileDigest(pathname));
  prop(this, 'context',       new (environment.context_class)(environment, logical_path, pathname));

  prop(this, 'dependencies',  []);
};


getter(Asset.prototype, 'digestPath', function () {
  var ext = path.extname(this.logical_path),
      base = path.basename(this.logical_path, ext);
  return base + '-' + this.hash + ext;
});


getter(Asset.prototype, 'hash', function () {
  return this.digest.hexdigest;
});


Asset.prototype.toArray = function () {
  return [this];
};
