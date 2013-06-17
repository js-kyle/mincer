/** internal
 *  class ProcessedAsset
 *
 *  `ProcessedAsset`s are internal representation of processable files.
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Asset]]
 **/


'use strict';


// 3rd-party
var _       = require('underscore');
var async   = require('async');


// internal
var noop    = require('../common').noop;
var prop    = require('../common').prop;
var getter  = require('../common').getter;
var Asset   = require('./asset');


////////////////////////////////////////////////////////////////////////////////


// internal class used to build dependency graph
function DependencyFile(pathname, mtime, digest) {
  prop(this, 'pathname',  pathname);
  prop(this, 'mtime',     mtime);
  prop(this, 'digest',    digest);
  prop(this, 'hash',     '<DependnecyFile ' + JSON.stringify(this) + '>');
}


////////////////////////////////////////////////////////////////////////////////


/**
 *  new ProcessedAsset()
 *
 *  See [[Asset.new]] for details.
 **/
var ProcessedAsset = module.exports = function ProcessedAsset() {
  Asset.apply(this, arguments);
  prop(this, 'type', 'processed');
};


require('util').inherits(ProcessedAsset, Asset);


/**
 *  ProcessedAsset#isFresh(environment) -> Boolean
 *  - environment (Environment|Index)
 *
 *  Checks if Asset is stale by comparing the actual mtime and
 *  digest to the inmemory model.
 **/
ProcessedAsset.prototype.isFresh = function (environment) {
  return _.all(this.__dependencyPaths__, function (dep) {
    return Asset.isDependencyFresh(environment, dep);
  });
};


// recursively iterate over all requried assets,
// gather a list of (compiling if needed) assets that should be required
function resolve_dependencies(self, paths, callback) {
  var assets = [], cache = {}, done;

  // async callback
  done = function (err) {
    callback(err, assets);
  };

  async.forEachSeries(paths, function (p, next) {
    var asset;

    if (p === self.pathname) {
      if (!cache[p]) {
        cache[p] = true;
        assets.push(self);
      }

      next();
      return;
    }

    asset = self.environment.findAsset(p, {bundle: false});
    if (asset) {
      asset.compile(function (err, asset) {
        if (err) {
          next(err);
          return;
        }

        asset.__requiredAssets__.forEach(function (asset_dependency) {
          if (!cache[asset_dependency.pathname]) {
            cache[asset_dependency.pathname] = true;
            assets.push(asset_dependency);
          }
        });

        next();
      });
      return;
    }

    // else
    next();
  }, done);
}


// build all required assets
function build_required_assets(self, context, callback) {
  var assets, stubs;

  async.series([
    function (next) {
      var paths = context.__requiredPaths__.concat([self.pathname]);
      resolve_dependencies(self, paths, function (err, arr) {
        assets = arr;
        next(err);
      });
    },
    function (next) {
      resolve_dependencies(self, context.__stubbedAssets__, function (err, arr) {
        stubs = arr;
        next(err);
      });
    },
    function (next) {
      prop(self, '__requiredAssets__', _.without(assets, stubs));
      next();
    }
  ], callback);
}


// prepare an ordered list (map) of dependencies
function build_dependency_paths(self, context, callback) {
  var dependency_paths = {};

  context.__dependencyPaths__.forEach(function (p) {
    var dep = new DependencyFile(p, self.environment.stat(p).mtime,
                                 self.environment.getFileDigest(p));
    dependency_paths[dep.hash] = dep;
  });

  async.forEachSeries(context.__dependencyAssets__, function (p, next) {
    var dep, asset;

    if (p === self.pathname) {
      dep = new DependencyFile(p, self.environment.stat(p).mtime,
                               self.environment.getFileDigest(p));
      dependency_paths[dep.hash] = dep;
      next();
      return;
    }

    asset = self.environment.findAsset(p, {bundle: false});
    if (asset) {
      asset.compile(function (err) {
        if (err) {
          next(err);
          return;
        }

        asset.dependencyPaths.forEach(function (d) {
          dependency_paths[d.hash] = d;
        });

        next();
      });
      return;
    }

    next();
  }, function (err) {
    prop(self, '__dependencyPaths__', Object.keys(dependency_paths));
    callback(err);
  });
}


// return digest based on digests of all dependencies
function compute_dependency_digest(self) {
  return _.inject(self.requiredAssets, function (digest, asset) {
    return digest.update(asset.digest);
  }, self.environment.digest).digest('hex');
}


// See apidoc of [[Asset#compile]]
ProcessedAsset.prototype.compile = function (callback) {
  var self = this, Klass, context, options;

  // make sure callback is callable
  callback = callback || noop;

  // do not compile again once asset was compiled
  if (this.isCompiled) {
    callback(null, this);
    return;
  }

  // prepare to build ourself
  Klass       = this.environment.ContextClass;
  context     = new Klass(this.environment, this.logicalPath, this.pathname);

  context.evaluate(self.pathname, options, function (err, source) {
    var tasks;

    if (err) {
      callback(err);
      return;
    }

    // TODO: Remove once laszySources would be dropped
    source = _.isString(source) ? source : source.toString();

    // save rendered string
    prop(self, '__buffer__', new Buffer(source));

    // update some props
    self.length = Buffer.byteLength(source);
    self.digest = self.environment.digest.update(source).digest('hex');

    // run after-compile tasks
    tasks = [
      function (next) { build_required_assets(self, context, next); },
      function (next) { build_dependency_paths(self, context, next); }
    ];

    async.series(tasks, function (err) {
      prop(self, 'dependencyDigest', compute_dependency_digest(self));
      callback(err, self);
    });
  });
};


// See apidoc of [[Asset#buffer]]
getter(ProcessedAsset.prototype, 'buffer', function () {
  this._requireCompilation('buffer');
  return this.__buffer__;
});


// See apidoc of [[Asset#source]]
getter(ProcessedAsset.prototype, 'source', function () {
  return this.buffer.toString('utf8');
});


// See [[Asset#isCompiled]] documentation
getter(ProcessedAsset.prototype, 'isCompiled', function () {
  return !!this.__buffer__;
});
