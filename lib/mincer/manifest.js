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
var _         = require('underscore');
var async     = require('async');
var mkdirp    = require('mkdirp');
var winston   = require('winston');


// internal
var prop       = require('./common').prop;
var getter     = require('./common').getter;
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
  var data;

  prop(this, 'environment', environment);

  // TODO: replace with logger initialization
  prop(this, 'logger',      winston);

  if ('' === path.extname(path)) {
    prop(this, 'dir',  path.resolve(pathname));
    prop(this, 'path', path.join(this.dir, 'manifest.json'));
  } else {
    prop(this, 'dir',   path.dirname(pathname));
    prop(this, 'path',  path.resolve(pathname));
  }

  if (path.existsSync(this.path)) {
    try {
      data = require(this.path);
    } catch (err) {
      // TODO: Replace with some kind of internal (configurable) logger
      this.logger.error(this.path + " is invalid: " + err);
    }
  }

  prop(this, 'data', (!!data && _.isObject(data)) ? data : {});
};


/**
 *  Manifest#assets -> Object
 *
 *  Returns internal assets mapping. Keys are logical paths which
 *  map to the latest fingerprinted filename.
 *
 *    Logical path (String): Fingerprint path (String)
 *
 *    { "application.js" => "application-2e8e9a7c6b0aafa0c9bdeec90ea30213.js",
 *      "jquery.js"      => "jquery-ae0908555a245f8266f77df5a8edca2e.js" }
 **/
getter(Manifest.prototype, 'assets', function () {
  if (!this.data.assets) {
    this.data.assets = {};
  }

  return this.data.assets;
});


/**
 *  Manifest#files -> Object
 *
 *  Returns internal file directory listing. Keys are filenames
 *  which map to an attributes array.
 *
 *    Fingerprint path (String):
 *      logical_path: Logical path (String)
 *      mtime: ISO8601 mtime (String)
 *      digest: Base64 hex digest (String)
 *
 *   { "application-2e8e9a7c6b0aafa0c9bdeec90ea30213.js" =>
 *       { 'logical_path' => "application.js",
 *         'mtime' => "2011-12-13T21:47:08-06:00",
 *         'digest' => "2e8e9a7c6b0aafa0c9bdeec90ea30213" } }
 **/
getter(Manifest.prototype, 'files', function () {
  if (!this.data.files) {
    this.data.files = {};
  }

  return this.data.files;
});


// Basic wrapper around Environment#findAsset and Environment#compile.
// Logs compile time.
Manifest.prototype.compileAsset = function (logicalPath, callback) {
  var self  = this,
      start = Date.now(),
      asset = self.environment.findAsset(logicalPath);

  if (!asset) {
    callback(new Error("Can not find asset '" + logicalPath + "'"));
    return;
  }

  asset.compile(function (err, asset) {
    var ms;

    if (err) {
      callback(err);
      return;
    }

    ms = +((Date.now() - start) / 1000);
    self.logger.warn('Compiled ' + logicalPath + ' (' + ms + 'ms)');

    callback(err, asset);
  });
};


function to_iso8601(mtime) {
  var date = new Date(Date.parse(mtime));
  return date.toISOString();
}


/**
 *  Manifest#compile(*files, callback) -> Void
 *
 *  Compile and write asset(s) to directory. The asset is written to a
 *  fingerprinted filename like `app-2e8e9a7c6b0aafa0c9bdeec90ea30213.js`.
 *  An entry is also inserted into the manifest file.
 *
 *    manifest.compile("app.js", function (err, data) {
 *      // ...
 *    });
 **/
Manifest.prototype.compile = function () {
  var self     = this,
      files    = _.flatten(arguments),
      callback = files.pop(),
      paths    = [];

  this.environment.eachLogicalPath(files, function (pathname) {
    if (pathname) {
      paths.push(pathname);
    } else {
      // FIXME: How this can be possible???
      return;
    }
  });

  paths = _.union(paths, _.select(files, isAbsolute));

  async.forEachSeries(paths, function (logicalPath, next) {
    self.compileAsset(logicalPath, function(err, asset) {
      var target;

      if (err) {
        callback(err);
        return;
      }

      target = path.join(self.dir, asset.digestPath);

      self.assets[asset.logicalPath]  = asset.digestPath;
      self.files[asset.digestPath]    = {
        logical_path:   asset.logicalPath,
        mtime:          to_iso8601(asset.mtime),
        size:           asset.bytesize,
        digest:         asset.digest
      };

      if (path.existsSync(target)) {
        self.logger.debug('Skipping ' + target + ', already exists');
        self.save();
        next();
      } else {
        self.logger.info('Writing ' + target);
        asset.writeTo(target, {}, function (err) {
          if (err) {
            next(err);
            return;
          }

          self.save();
          next();
        });
      }
    });
  }, function (err) {
    callback(err, self.data);
  });
};


// Persist manifest back to FS
Manifest.prototype.save = function () {
  mkdirp.sync(this.dir);
  fs.writeFileSync(this.path, JSON.stringify(this.data));
};
