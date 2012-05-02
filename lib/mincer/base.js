/** internal
 *  class Base
 *  includes Paths, Mime, Processing, Engines
 **/


'use strict';


// stdlib
var fs      = require('fs');
var path    = require('path');
var crypto  = require('crypto');


// 3rd-party
var _ = require('underscore');


// internal
var getter          = require('./common').getter;
var prop            = require('./common').prop;
var mixin           = require('./common').mixin;
var isAbsolute      = require('./common').isAbsolute;
var VERSION         = require('./version');
var AssetAttributes = require('./asset_attributes');
var StaticAsset     = require('./assets/static');
var ProcessedAsset  = require('./assets/processed');
var BundledAsset    = require('./assets/bundled');


/**
 *  new Base()
 **/
var Base = module.exports = function Base() {};


mixin(Base.prototype, require('./helpers/paths'));
mixin(Base.prototype, require('./helpers/mime'));
mixin(Base.prototype, require('./helpers/processing'));
mixin(Base.prototype, require('./helpers/engines'));


function attr_with_index_expire(name) {
  var internal = '__' + name + '__';
  Object.defineProperty(Base.prototype, name, {
    get: function () {
      return this[internal];
    },
    set: function (val) {
      this.expireIndex();
      this[internal] = val;
    }
  });
}


/**
 *  Base#digestAlgorithm -> String
 *
 *  Digest algorithm: `sha1`, `md5`, `sha256`, etc.
 *  See Node manual on `crypto` module.
 *
 *  Default: `md5`.
 **/
attr_with_index_expire('digestAlgorithm');


/**
 *  Base#version -> String
 *
 *  Assign an environment version.
 *
 *      environment.version = '2.0'
 **/
attr_with_index_expire('version');


/**
 *  Base#digest -> Hash
 *
 *  Returns a `Hash` instance for the `Environment`.
 *
 *  This value serves two purposes. If two `Environment`s have the
 *  same digest value they can be treated as equal. This is more
 *  useful for comparing environment states between processes rather
 *  than in the same. Two equal `Environment`s can share the same
 *  cached assets.
 *
 *  The value also provides a seed digest for all `Asset`
 *  digests. Any change in the environment digest will affect all of
 *  its assets.
 **/
getter(Base.prototype, 'digest', function () {
  // Do not cache, so the caller can safely mutate it with `.update`
  var digest = crypto.createHash(this.digestAlgorithm);

  // Compute the initial digest using the implementation class. The
  // Sprockets release version and custom environment version are
  // mixed in. So any new releases will affect all your assets.
  digest.update(VERSION, 'utf8');
  digest.update(this.version, 'utf8');

  return digest;
});


/**
 *  Base#cache -> Object
 *
 *  Persistent cache store.
 *  The cache store must implement a pair of getters and setters:
 *
 *    - `get(key)`
 *    - `set(key, value)`
 **/
attr_with_index_expire('cache');


function func_proxy_with_index_expire(name, func) {
  var orig = Base.prototype[name];

  Base.prototype[name] = function () {
    this.expireIndex();
    if (func) {
      func.apply(this, arguments);
    }
    orig.apply(this, arguments);
  };
}


func_proxy_with_index_expire('prependPath');
func_proxy_with_index_expire('appendPath');
func_proxy_with_index_expire('clearPaths');


Base.prototype.resolve = function (logicalPath, options, fn) {
  var resolved, args;

  if (fn) {
    args      = this.attributesFor(logicalPath).searchPaths;
    resolved  = this.__trail__.find(args, options, fn);
  } else {
    resolved = this.resolve(logicalPath, options, function (pathname) {
      return pathname;
    });

    if (!resolved) {
      throw 'FileNotFound';
    }

    // TODO: this should be throwed later -- as first part can return undefined
  }

  return resolved;
};


func_proxy_with_index_expire('registerMimeType', function (mimeType, ext) {
  this.__trail__.extensions.append(ext);
});

func_proxy_with_index_expire('registerEngine', function (ext, klass) {
  this.addEngineToTrail(ext, klass);
});

func_proxy_with_index_expire('registerPreprocessor');
func_proxy_with_index_expire('registerPostprocessor');
func_proxy_with_index_expire('registerBundleProcessor');
func_proxy_with_index_expire('unregisterPreprocessor');
func_proxy_with_index_expire('unregisterPostprocessor');
func_proxy_with_index_expire('unregisterBundleProcessor');


/**
 *  Base#index -> Index
 *
 *  Return an `Index`. Must be implemented by the subclass.
 **/
getter(Base.prototype, 'index', function () {
  throw new Error('Not implemented');
});


Base.prototype.entries = function (pathname) {
  return this.__trail__.entries(pathname);
};


Base.prototype.stat = function (pathname) {
  return this.__trail__.stat(pathname);
};


Base.prototype.getFileDigest = function (pathname) {
  var stat = this.stat(pathname);

  if (stat && stat.isFile()) {
    // If its a file, digest the contents
    return this.digest.update(fs.readFileSync(pathname)).digest('hex');
  } else if (stat && stat.isDirectory()) {
    // If its a directive, digest the list of filenames
    return this.digest.update(this.entries(pathname).join(',')).digest('hex');
  }
};


Base.prototype.attributesFor = function (pathname) {
  return new AssetAttributes(this, pathname);
};


Base.prototype.contentTypeOf = function (pathname) {
  return this.attributesFor(pathname).contentType;
};


Base.prototype.findAsset = function (pathname, options) {
  var logical_path = pathname;

  if (isAbsolute(pathname)) {
    if (!this.stat(pathname)) {
      return;
    }

    logical_path = this.attributesFor(pathname).logicalPath;
  } else {
    try {
      pathname = this.resolve(logical_path);
    } catch (err) {
      if ('FileNotFound' === err) {
        return null;
      }

      throw err;
    }
  }

  return this.buildAsset(logical_path, pathname, options);
};


Base.prototype.eachEntry = function (root, iterator) {
  var self = this, paths = [];

  this.entries(root).forEach(function (filename) {
    var pathname  = path.join(root, filename);

    paths.push(pathname);

    if (self.stat(pathname).isDirectory()) {
      self.eachEntry(pathname, function (subpath) {
        paths.push(subpath);
      });
    }
  });

  paths.sort().forEach(iterator);
};


Base.prototype.eachFile = function (iterator) {
  var self = this;

  this.paths.forEach(function (root) {
    self.eachEntry(root, function (pathname) {
      if (!self.stat(pathname).isDirectory()) {
        iterator(pathname);
      }
    });
  });
};


Base.prototype.eachLogicalPath = function () {
  var self = this,
      filters = _.flatten(_.slice(arguments)),
      iterator = filters.pop(),
      files = {};

  this.eachFile(function (filename) {
    var logical_path = self.logicalPathForFilename(filename, filters);
    if (!files[logical_path]) {
      iterator(logical_path);
      files[logical_path] = true;
    }
  });
};


Base.prototype.inspect = function () {
  return  "<#" + this.constructor.name + " " +
          "root=" + this.root + ", " +
          "paths=" + JSON.stringify(this.paths) + ", " +
          "digest=" + this.digest.digest('hex') + ">";
};



Base.prototype.expireIndex = function () {
  throw new Error("Not implemented");
};


var circular_calls = null;
function circular_call_protection(pathname, callback) {
  var reset = (null === circular_calls),
      calls = circular_calls || (circular_calls = []);

  if (0 <= calls.indexOf(pathname)) {
    if (reset) { circular_calls = null; }
    throw new Error("Circular dependency detected: " + pathname +
                    " has already been required");
  }

  calls.push(pathname);
  return callback();
}


Base.prototype.buildAsset = function (logicalPath, pathname, options) {
  var self = this;

  // If there are any processors to run on the pathname, use
  // `BundledAsset`. Otherwise use `StaticAsset` and treat is as binary.

  if (0 === this.attributesFor(pathname).processors.length) {
    return new StaticAsset(this.index, logicalPath, pathname);
  }

  if (options.bundle) {
    return new BundledAsset(this.index, logicalPath, pathname);
  }

  return circular_call_protection(pathname, function () {
    return new ProcessedAsset(self.index, logicalPath, pathname);
  });
};


Base.prototype.cacheKeyFor = function (pathname, options) {
  return pathname + String(options.bundle ? 1 : 0);
};


Base.prototype.logicalPathForFilename = function (filename, filters) {
  var logical_path = this.attributesFor(filename).logicalPath;

  if (this.matchesFilter(filters, logical_path)) {
    return logical_path;
  }

  // If filename is an index file, retest with alias
  if ('index' === path.basename(filename).split('.').shift()) {
    logical_path = logical_path.replace(/\/index\./, '.');
    if (this.matchesFilter(filters, logical_path)) {
      return logical_path;
    }
  }
};


Base.prototype.matchesFilter = function (filters, filename) {
  if (0 === filters.length) {
    return true;
  }

  return _.any(filters, function (filter) {
    if (_.isRegExp(filter)) {
      return filter.test(filename);
    } else if (_.isFunction(filter)) {
      return filter(filename);
    } else {
      return (new RegExp(filter.replace(/\*\*|\*|\?/, function (m) {
        switch (m[0]) {
          case "**":  return ".*?";
          case "*":   return "[^/]+";
          case "?":   return "[^/]?";
          default:    return m[0];
        }
      }))).test(filename);
    }
  });
};
