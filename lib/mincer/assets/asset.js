/** internal
 *  class Asset
 *
 *  The base class for [[BundledAsset]], [[ProcessedAsset]] and [[StaticAsset]].
 **/


'use strict';


// stdlib
var path = require('path');


// 3rd-party
var _ = require('lodash');


// internal
var prop   = require('../common').prop;
var getter = require('../common').getter;


////////////////////////////////////////////////////////////////////////////////


var TYPE_TO_KLASS_CACHE = {};


function typeToClass(type) {
  if (!TYPE_TO_KLASS_CACHE[type]) {
    TYPE_TO_KLASS_CACHE[type] = require('./' + type);
  }

  return TYPE_TO_KLASS_CACHE[type];
}


/**
 *  new Asset(environment, logicalPath, pathname)
 *  - environment (Environment)
 *  - logicalPath (String)
 *  - pathname (String)
 **/
var Asset = module.exports = function Asset(environment, logicalPath, pathname) {
  var mtime;

  if ('' === path.extname(logicalPath)) {
    throw new Error('Asset logical path has no extension: ' + logicalPath);
  }


  // drop mtime to 1 second
  mtime = environment.stat(pathname).mtime;
  mtime = new Date(parseInt(mtime.getTime() / 1000, 10) * 1000);

  prop(this, 'root',          environment.root);
  prop(this, 'environment',   environment);
  prop(this, 'logicalPath',   logicalPath);
  prop(this, 'pathname',      pathname);
  prop(this, 'contentType',   environment.contentTypeOf(pathname));
  prop(this, 'mtime',         mtime, {writable: true});
  prop(this, 'length',        environment.stat(pathname).size, {writable: true});
  prop(this, 'digest',        environment.getFileDigest(pathname), {writable: true});

  prop(this, '__requiredAssets__',  [], {writable: true});
  prop(this, '__dependencyPaths__', [], {writable: true});
};


// helper to sub-out getters of Asset.prototype
function stub_getter(name) {
  getter(Asset.prototype, name, function () {
    // this should never happen, as Asset is an abstract class and not
    // supposed to be used directly. subclasses must override this getters
    throw new Error(this.constructor.name + '#' + name + ' getter is not implemented.');
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
 *  `String` (concatenated) content of asset.
 **/
stub_getter('source');


/**
 *  Asset#digestPath -> String
 *
 *  Return logical path with digest spliced in.
 *
 *      "foo/bar-ce09b59f734f7f5641f2962a5cf94bd1.js"
 **/
getter(Asset.prototype, 'digestPath', function () {
  var ext = path.extname(this.logicalPath),
      sfx = '-' + this.digest + ext;
  return this.logicalPath.replace(new RegExp(ext + '$'), sfx);
});


/**
 *  Asset#toArray() -> Array
 *
 *  Expand asset into an `Array` of parts.
 *
 *  Appending all of an assets body parts together should give you
 *  the asset's contents as a whole.
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
  if (dep.mtime.getTime() >= stat.mtime.getTime()) {
    return true;
  }

  // If the mtime is newer, do a full digest comparsion.
  // Return fresh if the digests match. Otherwise, its stale.
  return (dep.digest === environment.getFileDigest(dep.pathname));
};


/**
 *  Asset#isFresh(environment) -> Boolean
 *  - environment (Environment|Index)
 *
 *  Checks if Asset is fresh by comparing the actual mtime and
 *  digest to the inmemory model.
 *
 *  Used to test if cached models need to be rebuilt.
 **/
Asset.prototype.isFresh = function (environment) {
  return Asset.isDependencyFresh(environment, this);
};


/** internal
 *  Asset#dependencyPaths -> Array
 *
 *  String paths that are marked as dependencies after processing.
 *  Default to an empty `Array`.
 **/
getter(Asset.prototype, 'dependencyPaths', function () {
  return this.__dependencyPaths__.slice();
});


/** internal
 *  Asset#requiredAssets -> Array
 *
 *  `ProcessedAsset`s that are required after processing.
 *  Default to an empty `Array`.
 **/
getter(Asset.prototype, 'requiredAssets', function () {
  return this.__requiredAssets__.slice();
});


/**
 *  Asset#relativePath -> String
 *
 *  Returns AssetAttributes#relativePath of current file.
 **/
getter(Asset.prototype, 'relativePath', function () {
  return this.environment.attributesFor(this.pathname).relativePath;
});


Asset.prototype.relativizeRootPath = function (pathname) {
  pathname = String(pathname);

  if (this.root === pathname.substr(0, this.root.length)) {
    return '$root' + pathname.substr(this.root.length);
  } else {
    return pathname;
  }
};



Asset.prototype.expandRootPath = function (pathname) {
  return String(pathname).replace(/^\$root/, this.root);
};


Asset.prototype.encodeWith = function (hash) {
  hash.type        = this.type;
  hash.logicalPath = this.logicalPath;
  hash.pathname    = this.relativizeRootPath(this.pathname);
  hash.contentType = this.contentType;
  hash.mtime       = this.mtime.getTime();
  hash.length      = this.length;
  hash.digest      = this.digest;
};


Asset.prototype.initWith = function (environment, hash) {
  prop(this, 'root',          environment.root);
  prop(this, 'environment',   environment);
  prop(this, 'logicalPath',   hash.logicalPath);
  prop(this, 'pathname',      this.expandRootPath(hash.pathname));
  prop(this, 'contentType',   hash.contentType);
  prop(this, 'mtime',         new Date(hash.mtime), {writable: true});
  prop(this, 'length',        hash.length, {writable: true});
  prop(this, 'digest',        hash.digest, {writable: true});

  prop(this, '__requiredAssets__',  [], {writable: true});
  prop(this, '__dependencyPaths__', [], {writable: true});
};


Asset.fromHash = function (environment, hash) {
  try {
    var asset, klass;

    if (_.isPlainObject(hash)) {
      klass = typeToClass(hash.type);

      if (klass) {
        asset = Object.create(klass.prototype);
        prop(asset, 'type', hash.type); // KLUDGE: Use constructor.name
        asset.initWith(environment, hash);
      }
    }

    return asset;
  } catch (e) {
    if ('unserialize_error' === e.code) {
      // do nothing
      return;
    }

    throw e;
  }
};
