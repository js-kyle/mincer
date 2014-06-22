/** internal
 *  class Base
 *
 *  Base class for [[Environment]] and [[Index]].
 *
 *
 *  ##### INCLUDES
 *
 *  - [[Engines]]
 *  - [[Mime]]
 *  - [[Processing]]
 *  - [[Paths]]
 **/


'use strict';


// stdlib
var fs      = require('fs');
var path    = require('path');
var crypto  = require('crypto');


// 3rd-party
var _ = require('lodash');


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


////////////////////////////////////////////////////////////////////////////////


/**
 *  new Base()
 **/
var Base = module.exports = function Base() {};


mixin(Base.prototype, require('./helpers/paths'));
mixin(Base.prototype, require('./helpers/mime'));
mixin(Base.prototype, require('./helpers/caching'));
mixin(Base.prototype, require('./helpers/processing'));
mixin(Base.prototype, require('./helpers/compressing'));
mixin(Base.prototype, require('./helpers/configuring'));
mixin(Base.prototype, require('./helpers/engines'));


// helper that defines property which fires expireIndex()
// each time it gets changed
function attr_with_expire_index(name, value) {
  var __name__ = '__' + name + '__';

  // set underlying value
  prop(Base.prototype, __name__, value, {writable: true});

  // provide getters/setter
  Object.defineProperty(Base.prototype, name, {
    get: function () {
      return this[__name__];
    },
    set: function (val) {
      this.expireIndex();
      this[__name__] = val;
    }
  });
}


/**
 *  Base#cache -> Mixed
 *
 *  Cache backend.
 *
 *  Default: `null`.
 **/
attr_with_expire_index('cache', null);


/**
 *  Base#digestAlgorithm -> String
 *
 *  Digest algorithm: `sha1` or `md5`.
 *  See Node manual on `crypto` module.
 *
 *  Default: `md5`.
 **/
attr_with_expire_index('digestAlgorithm', 'md5');


/**
 *  Base#version -> String
 *
 *  Environment version.
 *
 *      environment.version = '2.0'
 **/
attr_with_expire_index('version', '');


/**
 *  Base#digest -> crypto.Hash
 *
 *  Returns a `crypto.Hash` instance for the `Environment`.
 *
 *  This value serves two purposes. If two `Environment`s have the
 *  same digest value they can be treated as equal. This is more
 *  useful for comparing environment states between processes rather
 *  than in the same. Two equal `Environment`s can share the same
 *  cached assets.
 *
 *  The value also provides a seed digest for all `Asset` digests.
 *  Any change in the environment digest will affect all of its assets.
 **/
getter(Base.prototype, 'digest', function () {
  // Do not cache, so the caller can safely mutate it with `.update`
  var digest = crypto.createHash(this.digestAlgorithm);

  // Mixin Mincer release version and custom environment version.
  // So any new releases will affect all your assets.
  digest.update(VERSION,      'utf8');
  digest.update(this.version, 'utf8');

  return digest;
});


// helper that overrides defined method `name` with wrapper that expireIndex()
// and calls `func` when provided before calling original method
function func_proxy_with_expire_index(name, func) {
  var orig = Base.prototype[name];

  Base.prototype[name] = function () {
    this.expireIndex();
    if (func) {
      func.apply(this, arguments);
    }
    orig.apply(this, arguments);
  };
}


//
// override [[Paths]] mixin methods
//

func_proxy_with_expire_index('prependPath');
func_proxy_with_expire_index('appendPath');
func_proxy_with_expire_index('clearPaths');

//
// override [[Mime]] mixin methods
//

func_proxy_with_expire_index('registerMimeType', function (mimeType, ext) {
  this.__trail__.extensions.append(ext);
});

//
// override [[Engines]] mixin methods
//

func_proxy_with_expire_index('registerEngine', function (ext, klass) {
  this.addEngineToTrail(ext, klass);
});

//
// override [[Processing]] mixin methods
//

func_proxy_with_expire_index('registerPreprocessor');
func_proxy_with_expire_index('registerPostprocessor');
func_proxy_with_expire_index('registerBundleProcessor');
func_proxy_with_expire_index('unregisterPreprocessor');
func_proxy_with_expire_index('unregisterPostprocessor');
func_proxy_with_expire_index('unregisterBundleProcessor');


/**
 *  Base#resolve(logicalPath[, options = {}[, fn]]) -> String
 *  - logicalPath (String)
 *  - options (Object)
 *  - fn (Function)
 *
 *  Finds the expanded real path for a given logical path by
 *  searching the environment's paths.
 *
 *      env.resolve("application.js")
 *      # => "/path/to/app/javascripts/application.js.coffee"
 *
 *  An Error with `code = 'FileNotFound'` is raised if the file does not exist.
 **/
Base.prototype.resolve = function (logicalPath, options, fn) {
  var err, resolved, search;

  if (fn) {
    search = this.attributesFor(logicalPath).searchPaths;
    return this.__trail__.find(search, options, function (pathname) {
      var bower, extname, mainfile;

      if (!_.contains(['component.json', 'bower.json'], path.basename(pathname))) {
        return fn(pathname);
      }

      bower = require(pathname);

      if (_.isString(bower.main)) {
        return fn(path.join(path.dirname(pathname), bower.main));
      }

      if (_.isArray(bower.main)) {
        extname = path.extname(logicalPath);

        while (bower.main.length) {
          mainfile = bower.main[0];

          if ('' === extname || extname === path.extname(mainfile)) {
            return fn(path.join(path.dirname(pathname), mainfile));
          }
        }
      }

      return;
    });
  }

  resolved = this.resolve(logicalPath, options, function (pathname) {
    return pathname;
  });

  if (!resolved) {
    err = new Error('Could not find file \'' + logicalPath + '\'');
    err.code = 'FileNotFound';
    throw err;
  }

  return resolved;
};


/**
 *  Base#entries(pathname) -> Array
 *  - pathname (String)
 *
 *  Proxy to `Hike.Trail#entries`. Works like `fs.readdirSync`.
 *  Subclasses may cache this method.
 **/
Base.prototype.entries = function (pathname) {
  return this.__trail__.entries(pathname);
};


/**
 *  Base#stat(pathname) -> fs.Stats
 *  - pathname (String)
 *
 *  Proxy to `Hike.Trail#stat`. Works like `fs.statSync`.
 *  Subclasses may cache this method.
 **/
Base.prototype.stat = function (pathname) {
  return this.__trail__.stat(pathname);
};


/**
 *  Base#getFileDigest(pathname) -> String
 *  - pathname (String)
 *
 *  Read and compute digest of filename.
 *  Subclasses may cache this method.
 **/
Base.prototype.getFileDigest = function (pathname) {
  var stat = this.stat(pathname);

  if (stat && stat.isDirectory()) {
    // If directory, digest the list of filenames
    return this.digest.update(this.entries(pathname).join(',')).digest('hex');
  }

  // If file, digest the contents
  return this.digest.update(fs.readFileSync(pathname)).digest('hex');
};


/** internal
 *  Base#attributesFor(pathname) -> AssetAttributes
 *  - pathname (String)
 *
 *  Returns a `AssetAttributes` for `pathname`
 **/
Base.prototype.attributesFor = function (pathname) {
  return new AssetAttributes(this, pathname);
};


/** internal
 *  Base#contentTypeOf(pathname) -> String
 *  - pathname (String)
 *
 *  Returns content type of `pathname`
 **/
Base.prototype.contentTypeOf = function (pathname) {
  return this.attributesFor(pathname).contentType;
};


/**
 *  Base#findAsset(pathname[, options = {}]) -> Asset|Null
 *  - pathname (String)
 *  - options (Object)
 *
 *  Find asset by logical path or expanded path.
 **/
Base.prototype.findAsset = function (pathname, options) {
  var logical_path = pathname, expanded_path;

  if (isAbsolute(pathname)) {
    if (!this.stat(pathname)) {
      return null;
    }

    logical_path = this.attributesFor(pathname).logicalPath;
  } else {
    try {
      pathname = this.resolve(logical_path);

      if ('' === path.extname(logical_path)) {
        expanded_path = this.attributesFor(pathname).logicalPath;
        logical_path += path.extname(expanded_path);
      }
    } catch (err) {
      if ('FileNotFound' === err.code) {
        return null;
      }

      throw err;
    }
  }

  return this.buildAsset(logical_path, pathname, options);
};


/**
 *  Base#eachEntry(root, iterator) -> Void
 *  - root (String)
 *  - iterator (Function)
 *
 *  Calls `iterator` on each found file or directory in alphabetical order:
 *
 *      env.eachEntry('/some/path', function (entry) {
 *        console.log(entry);
 *      });
 *      // -> "/some/path/a"
 *      // -> "/some/path/a/b.txt"
 *      // -> "/some/path/a/c.txt"
 *      // -> "/some/path/b.txt"
 **/
Base.prototype.eachEntry = function (root, iterator) {
  var self = this, paths = [];

  this.entries(root).forEach(function (filename) {
    var pathname  = path.join(root, filename),
        stats     = self.stat(pathname);

    if (!stats) {
      // File not found - silently skip it.
      // It might happen only if we got "broken" symlink in real life.
      // See https://github.com/nodeca/mincer/issues/18
      return;
    }

    paths.push(pathname);

    if (stats.isDirectory()) {
      self.eachEntry(pathname, function (subpath) {
        paths.push(subpath);
      });
    }
  });

  paths.sort().forEach(iterator);
};


/**
 *  Base#eachFile(iterator) -> Void
 *  - iterator (Function)
 *
 *  Calls `iterator` for each file found within all registered paths.
 **/
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


// Returns true if there were no filters, or `filename` matches at least one
function matches_filter(filters, logicalPath, filename) {
  if (0 === filters.length) {
    return true;
  }

  return _.any(filters, function (filter) {
    if (_.isRegExp(filter)) {
      return filter.test(logicalPath);
    }

    if (_.isFunction(filter)) {
      return filter(logicalPath, filename);
    }

    // prepare string to become RegExp.
    // mimics shell's globbing
    filter = filter.toString().replace(/\*\*|\*|\?|\\.|\./g, function (m) {
      if ('*' === m[0]) {
        return '**' === m ? '.+?' : '[^/]+?';
      }

      if ('?' === m[0]) {
        return '[^/]?';
      }

      if ('.' === m[0]) {
        return '\\.';
      }

      // handle `\\.` part
      return m;
    });

    // prepare RegExp
    filter = new RegExp('^' + filter + '$');
    return filter.test(logicalPath);
  });
}


// Returns logicalPath for `filename` if it mtches given filters
function logical_path_for_filename(self, filename, filters) {
  var logical_path = self.attributesFor(filename).logicalPath;

  if (matches_filter(filters, logical_path, filename)) {
    return logical_path;
  }

  // If filename is an index file, retest with alias
  if ('index' === path.basename(filename).split('.').shift()) {
    logical_path = logical_path.replace(/\/index\./, '.');
    if (matches_filter(filters, logical_path, filename)) {
      return logical_path;
    }
  }
}


/**
 *  Base#eachLogicalPath(filters, iterator) -> Void
 *  - filters (Array)
 *  - iterator (Function)
 *
 *  Calls `iterator` on each found logical path (once per unique path) that
 *  matches at least one of the given filters.
 *
 *  Each filter might be a `String`, `RegExp` or a `Function`.
 **/
Base.prototype.eachLogicalPath = function (filters, iterator) {
  var self = this, files = {};

  this.eachFile(function (filename) {
    var logical_path = logical_path_for_filename(self, filename, filters);
    if (logical_path && !files[logical_path]) {
      iterator(logical_path, filename);
      files[logical_path] = true;
    }
  });
};


// circular call  protection helper.
// keeps array of required pathnames until the function
// that originated protection finishes it's execution
var circular_calls = null;


function circular_call_protection(pathname, callback) {
  var reset = (null === circular_calls),
      calls = circular_calls || (circular_calls = []);

  try {
    if (0 <= calls.indexOf(pathname)) {
      throw new Error('Circular dependency detected: ' + pathname +
                      ' has already been required');
    }

    calls.push(pathname);
    return callback();
  } finally {
    if (reset) {
      circular_calls = null;
    }
  }
}


// creates instance of [[StaticAsset]], [[BundledAsset]] or [[ProcessedAsset]]
Base.prototype.buildAsset = function (logicalPath, pathname, options) {
  var self = this;

  options = options || {};

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


// Returns cache key for given `pathname` based on options
Base.prototype.cacheKeyFor = function (pathname, options) {
  return pathname + String(options.bundle ? 1 : 0);
};
