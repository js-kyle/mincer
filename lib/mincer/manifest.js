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
var fs     = require('fs');
var path   = require('path');
var format = require('util').format;


// 3rd-party
var _         = require('lodash');
var async     = require('async');
var fstools   = require('fs-tools');


// internal
var prop        = require('./common').prop;
var getter      = require('./common').getter;
var isAbsolute  = require('./common').isAbsolute;
var start_timer = require('./common').timer;
var logger      = require('./logger');


/**
 *  new Manifest(environment, path)
 *
 *  Create new Manifest associated with an `environment`. `path` is
 *  a full path to the manifest json file. The file may or may not
 *  already exist. The dirname of the `path` will be used to write
 *  compiled assets to. Otherwise, if the path is a directory, the
 *  filename will default to "manifest.json" in that directory.
 *
 *      new Manifest(environment, "./public/assets/manifest.json");
 **/
var Manifest = module.exports = function Manifest(environment, pathname) {
  var data;

  prop(this, 'environment', environment);

  if ('' === path.extname(pathname)) {
    prop(this, 'dir',   path.resolve(pathname));
    prop(this, 'path',  path.join(this.dir, 'manifest.json'));
  } else {
    prop(this, 'dir',   path.dirname(pathname));
    prop(this, 'path',  path.resolve(pathname));
  }

  if (fs.existsSync(this.path)) {
    try {
      data = require(this.path);
    } catch (err) {
      logger.error(this.path + ' is invalid: ' + err);
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
 *
 *  ##### Synopsis:
 *
 *      Logical path (String): Fingerprint path (String)
 *
 *
 *  ##### Example:
 *
 *      {
 *        "application.js" : "application-2e8e9a7c6b0aafa0c9bdeec90ea30213.js",
 *        "jquery.js"      : "jquery-ae0908555a245f8266f77df5a8edca2e.js"
 *      }
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
 *
 *  ##### Synopsis:
 *
 *      Fingerprint path (String):
 *        logical_path: Logical path (String)
 *        mtime: ISO8601 mtime (String)
 *        digest: Base64 hex digest (String)
 *
 *
 *  ##### Example:
 *
 *    {
 *      "application-2e8e9a7c6b0aafa0c9bdeec90ea30213.js" : {
 *        'logical_path'  : "application.js",
 *        'mtime'         : "2011-12-13T21:47:08-06:00",
 *        'digest'        : "2e8e9a7c6b0aafa0c9bdeec90ea30213"
 *      }
 *    }
 **/
getter(Manifest.prototype, 'files', function () {
  if (!this.data.files) {
    this.data.files = {};
  }

  return this.data.files;
});


/**
 *  Manifest#compile(files[, callback]) -> Void
 *  - files (Array):
 *  - callback (Function):
 *
 *  Compile and write asset(s) to directory. The asset is written to a
 *  fingerprinted filename like `app-2e8e9a7c6b0aafa0c9bdeec90ea30213.js`.
 *  An entry is also inserted into the manifest file.
 *
 *      manifest.compile(["app.js"], function (err, data) {
 *        //  data => {
 *        //    files: {
 *        //      "app.js" : "app-2e8e9a7c6b0aafa0c9bdeec90ea30213.js",
 *        //      ...
 *        //    },
 *        //    assets: {
 *        //      "app-2e8e9a7c6b0aafa0c9bdeec90ea30213.js" : {
 *        //        "logical_path"  : "app.js",
 *        //        "mtime"         : "2011-12-13T21:47:08-06:00",
 *        //        "digest"        : "2e8e9a7c6b0aafa0c9bdeec90ea30213"
 *        //      },
 *        //      ...
 *        //    }
 *        //  }
 *      });
 **/
Manifest.prototype.compile = function (files, callback) {
  var self     = this,
      paths    = [];

  if (!this.environment) {
    throw new Error('Manifest requries environment for compilation');
  }

  this.environment.eachLogicalPath(files, function (pathname) {
    paths.push(pathname);
  });

  paths = _.union(paths, _.select(files, isAbsolute));

  async.forEachSeries(paths, function (logicalPath, next) {
    var timer = start_timer(), asset, target;

    asset = self.environment.findAsset(logicalPath, {bundle: true});

    if (!asset) {
      next(new Error('Can not find asset \'' + logicalPath + '\''));
      return;
    }

    logger.debug(format('Compiled %s (%dms)', logicalPath, timer.stop()));

    target = path.join(self.dir, asset.digestPath);

    self.assets[asset.logicalPath]  = asset.digestPath;
    self.files[asset.digestPath]    = {
      logical_path:   asset.logicalPath,
      mtime:          asset.mtime.toISOString(),
      size:           asset.length,
      digest:         asset.digest
    };

    fs.exists(target, function (exists) {
      var steps = [];

      if (exists) {
        logger.debug('Skipping ' + target + ', already exists');
        self.save(next);
        return;
      }

      steps.push(function (next) {
        asset.writeTo(target, {}, next);
      });

      if ('bundled' === asset.type) {
        steps.push(function (next) {
          asset.writeTo(target + '.gz', {}, next);
        });
      }

      steps.push(function (next) {
        self.save(next);
      });

      logger.info('Writing ' + target);
      async.series(steps, next);
    });
  }, function (err) {
    callback(err, self.data);
  });
};


// Persist manifest back to FS
Manifest.prototype.save = function (callback) {
  async.series([
    async.apply(fstools.mkdir, this.dir),
    async.apply(fs.writeFile, this.path, JSON.stringify(this.data, null, '  '))
  ], callback);
};
