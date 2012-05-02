/**
 *  class Manifest
 *
 *  The Manifest logs the contents of assets compiled to a single
 *  directory. It records basic attributes about the asset for fast
 *  lookup without having to compile. A pointer from each logical path
 *  indicates with fingerprinted asset is the current one.
 *
 *  The JSON is part of the public API and should be considered
 *  stable. This should make it easy to read from other programming
 *  languages and processes that don't have sprockets loaded. See
 *  `#assets` and `#files` for more infomation about the structure.
 **/


'use strict';


// stdlib
var fs   = require('fs');
var path = require('path');


// 3rd-party
var _     = require('underscore');
var async = require('async');


// internal
var prop       = require('./common').prop;
var isAbsolute = require('./common').isAbsolute;


/**
 *  new Manifest(environment, path)
 *
 *  Create new Manifest associated with an `environment`. `path` is
 *  a full path to the manifest json file. The file may or may not
 *  already exist. The dirname of the `path` will be used to write
 *  compiled assets to. Otherwise, if the path is a directory, the
 *  filename will default to "manifest.json" in that directory.
 *
 *    new Manifest(environment, "./public/assets/manifest.json");
 **/
var Manifest = module.exports = function Manifest(environment, pathname) {
  prop(this, 'environment', environment);

  if ('' === path.extname(path)) {
    prop(this, 'dir',  path.resolve(pathname));
    prop(this, 'path', path.join(this.dir, 'manifest.json'));
  } else {
    prop(this, 'dir',   path.dirname(pathname));
    prop(this, 'path',  path.resolve(pathname));
  }
};


Manifest.prototype.compile = function () {
  var self     = this,
      args     = _.flatten(arguments),
      callback = args.pop(),
      paths    = [];

  this.environment.eachLogicalPath(args, function (pathname) {
    if (pathname) {
      paths.push(pathname);
    } else {
      // FIXME: How this can be possible???
      return;
    }
  });

  paths = _.union(paths, _.select(args, isAbsolute));

  async.forEachSeries(paths, function (pathname, next) {
    self.environment.findAsset(pathname).compile(function (err, asset) {
      var target = path.join(self.dir, asset.digestPath);
      asset.writeTo(target, {}, next);
    });
  }, callback);
};
