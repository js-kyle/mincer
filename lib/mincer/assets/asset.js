/** internal
 *  class Asset
 *
 *  The base class for [[BundledAsset]], [[ProcessedAsset]] and [[StaticAsset]].
 **/


'use strict';


// stdlib
var fs    = require('fs');
var path  = require('path');
var zlib  = require('zlib');


// 3rd-party
var async   = require('async');
var mkdirp  = require('mkdirp');


// internal
var prop    = require('../common').prop;
var getter  = require('../common').getter;


////////////////////////////////////////////////////////////////////////////////


/**
 *  new Asset(environment, logicalPath, pathname)
 *  - environment (Environment)
 *  - logicalPath (String)
 *  - pathname (String)
 **/
var Asset = module.exports = function Asset(environment, logicalPath, pathname) {
  prop(this, 'root',          environment.root);
  prop(this, 'environment',   environment);
  prop(this, 'logicalPath',   logicalPath);
  prop(this, 'pathname',      pathname);
  prop(this, 'contentType',   environment.contentTypeOf(pathname));
  prop(this, 'mtime',         environment.stat(pathname).mtime, {writable: true});
  prop(this, 'length',        environment.stat(pathname).size, {writable: true});
  prop(this, 'digest',        environment.getFileDigest(pathname), {writable: true});
};


// helper to sub-out getters of Asset.prototype
function stub_getter(name) {
  getter(Asset.prototype, name, function () {
    // this should never happen, as Asset is an abstract class and not
    // supposed to be used directly. subclasses must override this getters
    throw new Error(this.constructor.name + "#" + name + " getter is not implemented.");
  });
}


/**
 *  Asset#buffer -> Buffer
 *
 *  `Buffer` content of asset.
 **/
stub_getter('buffer');


/**
 *  Asset#source -> String
 *
 *  `String` content of asset.
 **/
stub_getter('source');



getter(Asset.prototype, 'digestPath', function () {
  var ext   = path.extname(this.logicalPath),
      base  = path.basename(this.logicalPath, ext);
  return base + '-' + this.digest + ext;
});


/**
 *  Asset#toArray() -> Array
 **/
Asset.prototype.toArray = function () {
  return [this];
};


/** alias of: Asset#source
 *  Asset#toString() -> String
 **/
Asset.prototype.toString = function () {
  return this.source;
};


/**
 *  Asset.isDependencyFresh(environment, dep) -> Boolean
 *  - environment (Environment|Index)
 *  - dep (Asset)
 *
 *  Returns whenever given `dep` asset is fresh by checking it's mtime, and
 *  contents if it's match.
 **/
Asset.isDependencyFresh = function (environment, dep) {
  var stat = environment.stat(dep.pathname);

  // If path no longer exists, its definitely stale.
  if (!stat) {
    return false;
  }

  // Compare dependency mime to the actual mtime. If the
  // dependency mtime is newer than the actual mtime, the file
  // hasn't changed since we created this `Asset` instance.
  //
  // However, if the mtime is newer it doesn't mean the asset is
  // stale. Many deployment environments may recopy or recheckout
  // assets on each deploy. In this case the mtime would be the
  // time of deploy rather than modified time.
  if (Date.parse(dep.mtime) >= Date.parse(stat.mtime)) {
    return true;
  }

  // If the mtime is newer, do a full digest comparsion.
  // Return fresh if the digests match. Otherwise, its stale.
  return (dep.digest === environment.getFileDigest(dep.pathname));
};


Asset.prototype.isFresh = function (env) {
  return Asset.isDependencyFresh(this.environment, this);
};


getter(Asset.prototype, 'requiredAssets', function () {
  if (!this.__requiredAssets__) {
    prop(this, '__requiredAssets__', [], {writable: true});
  }

  if (!this.__source__) {
    throw new Error("Can't get required asset before compile()");
  }

  return this.__requiredAssets__;
});


getter(Asset.prototype, 'dependencyPaths', function () {
  if (!this.__dependencyPaths__) {
    prop(this, '__dependencyPaths__', [], {writable: true});
  }

  if (!this.__source__) {
    throw new Error("Can't get required asset before compile()");
  }

  return this.__dependencyPaths__;
});


var copier = {
  simple: function (buffer, to, callback) {
    fs.writeFile(to, buffer, callback);
  },

  gzipped: function (buffer, to, callback) {
    zlib.createGzip().gzip(buffer, function (err, str) {
      if (err) {
        callback(err);
        return;
      }

      fs.writeFile(to, str, callback);
    });
  }
};


Asset.prototype.writeTo = function (filename, options, callback) {
  var mtime    = this.mtime,
      tempname = filename + "+";

  options = options || {};

  if (!callback) {
    callback  = options;
    options   = {};
  }

  if (undefined === options.compress && '.gz' === path.extname(filename)) {
    options.compress = true;
  }

  this.compile(function (err, self) {
    if (err) {
      callback(err);
      return;
    }

    mkdirp(path.dirname(filename), function (err) {
      var buffer;

      if (err) {
        callback(err);
        return;
      }

      buffer = new Buffer(self.source);
      copier[options.compress ? 'gzipped' : 'simple'](buffer, tempname, function (err) {
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
  });
};


Asset.prototype.compile = function (callback) {
  callback(null, this);
};
