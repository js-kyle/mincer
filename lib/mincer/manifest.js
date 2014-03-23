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
var fstools   = require('fs-tools');
var pako      = require('pako');


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


// Coerce data to buffer
function toBuffer(data) {
  return Buffer.isBuffer(data) ? data : new Buffer(data);
}


// Write data String/Buffer into filename
function write(filename, mtime, data) {
  var tempname = filename + '+';

  try {
    fstools.mkdirSync(path.dirname(filename));
    fs.writeFileSync(tempname, toBuffer(data));
    fs.renameSync(tempname, filename);
    fs.utimesSync(filename, mtime, mtime);
  } catch (err) {
    // Try to remove tmp file on error.
    // Don't check if exists, just suppress errors
    try { fstools.removeSync(tempname); } catch (_) {}

    throw err;
  }
}


// Compress given String or Buffer
function gzip(data) {
  return new Buffer(pako.gzip(new Uint8Array(toBuffer(data))));
}


/**
 *  Manifest#compile(files[, callback]) -> Object
 *  - files (Array):
 *  - options (Object):
 *
 *  ##### options:
 *
 *  - `sourceMaps` (false) - set `true` to write sourcemap files
 *  - `embedMappingComments` (false) - set `true` to embed sourcemap url
 *    into created files
 *  - `compress` (false) - set `true` to also create gzipped files
 *
 *  Compile and write asset(s) to directory. The asset is written to a
 *  fingerprinted filename like `app-2e8e9a7c6b0aafa0c9bdeec90ea30213.js`.
 *  An entry is also inserted into the manifest file.
 *
 *  Returns manifest content on success. Throws exception on error.
 *
 *      var data = manifest.compile(["app.js"]);
 *
 *      //  data => {
 *      //    files: {
 *      //      "app.js" : "app-2e8e9a7c6b0aafa0c9bdeec90ea30213.js",
 *      //      ...
 *      //    },
 *      //    assets: {
 *      //      "app-2e8e9a7c6b0aafa0c9bdeec90ea30213.js" : {
 *      //        "logical_path"  : "app.js",
 *      //        "mtime"         : "2011-12-13T21:47:08-06:00",
 *      //        "digest"        : "2e8e9a7c6b0aafa0c9bdeec90ea30213"
 *      //      },
 *      //      ...
 *      //    }
 *      //  }
 **/
Manifest.prototype.compile = function (files, options) {
  var self     = this,
      paths    = [];

  if (!this.environment) {
    throw new Error('Manifest requries environment for compilation');
  }

  options = options || {};

  this.environment.eachLogicalPath(files, function (pathname) {
    paths.push(pathname);
  });

  paths = _.union(paths, _.select(files, isAbsolute));

  paths.forEach(function (logicalPath) {
    var timer = start_timer(), asset, target;

    asset = self.environment.findAsset(logicalPath, {bundle: true});

    if (!asset) {
      throw new Error('Can not find asset \'' + logicalPath + '\'');
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

    if (fs.existsSync(target)) {
      logger.debug('Skipping ' + target + ', already exists');
      self.save();
      return;
    }

    var buffer;

    if (options.embedMappingComments && options.sourceMaps && asset.sourceMap) {
      buffer = new Buffer(asset.source + asset.mappingUrlComment());
    } else {
      buffer = asset.buffer;
    }

    write(target, asset.mtime, buffer);

    if ('bundled' === asset.type && options.compress) {
      write(target + '.gz', asset.mtime, gzip(buffer));
    }

    if (asset.sourceMap) {
      // add XSSI protection header
      write(target + '.map', asset.mtime, ')]}\n' + asset.sourceMap);
      if (options.compress) {
        write(target + '.map.gz', asset.mtime, gzip(')]}\n' + asset.sourceMap));
      }
    }

    self.save();
    logger.info('Writing ' + target);
  });

  return self.data;
};


// Persist manifest back to FS
Manifest.prototype.save = function () {
  fstools.mkdirSync(this.dir);
  fs.writeFileSync(this.path, JSON.stringify(this.data, null, '  '));
};
