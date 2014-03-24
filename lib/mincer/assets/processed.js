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
var _ = require('lodash');


// internal
var prop    = require('../common').prop;
var getter  = require('../common').getter;
var Asset   = require('./asset');


////////////////////////////////////////////////////////////////////////////////


// internal class used to build dependency graph
function DependencyFile(pathname, mtime, digest) {
  this.pathname = pathname;
  this.mtime    = mtime;
  this.digest   = digest;
}


// recursively iterate over all requried assets,
// gather a list of (compiling if needed) assets that should be required
function resolveDependencies(self, paths) {
  var assets = [], cache = {};

  _.forEach(paths, function (p) {
    var asset;

    if (p === self.pathname) {
      if (!cache[p]) {
        cache[p] = true;
        assets.push(self);
      }
      return;
    }

    asset = self.environment.findAsset(p, { bundle: false });

    if (asset) {
      asset.__requiredAssets__.forEach(function (asset_dependency) {
        if (!cache[asset_dependency.pathname]) {
          cache[asset_dependency.pathname] = true;
          assets.push(asset_dependency);
        }
      });
    }
  });

  return assets;
}


// build all required assets
function buildRequiredAssets(self, context) {
  var paths   = context.__requiredPaths__.concat([self.pathname]),
      assets  = resolveDependencies(self, paths),
      stubs   = resolveDependencies(self, context.__stubbedAssets__);

  prop(self, '__requiredAssets__', _.without(assets, stubs));
}


// prepare an ordered list (map) of dependencies
function buildDependencyPaths(self, context) {
  var dependencies = {};

  context.__dependencyPaths__.forEach(function (p) {
    var dep = new DependencyFile(p, self.environment.stat(p).mtime,
                                 self.environment.getFileDigest(p));
    dependencies[JSON.stringify(dep)] = dep;
  });

  _.forEach(context.__dependencyAssets__, function (p) {
    var dep, asset;

    if (p === self.pathname) {
      dep = new DependencyFile(p, self.environment.stat(p).mtime,
                               self.environment.getFileDigest(p));
      dependencies[JSON.stringify(dep)] = dep;
      return;
    }

    asset = self.environment.findAsset(p, {bundle: false});

    if (asset) {
      asset.dependencyPaths.forEach(function (dep) {
        dependencies[JSON.stringify(dep)] = dep;
      });
    }
  });

  prop(self, '__dependencyPaths__', _.values(dependencies));
}


// return digest based on digests of all dependencies
function computeDependencyDigest(self) {
  return _.inject(self.requiredAssets, function (digest, asset) {
    return digest.update(asset.digest);
  }, self.environment.digest).digest('hex');
}


////////////////////////////////////////////////////////////////////////////////


/**
 *  new ProcessedAsset()
 *
 *  See [[Asset.new]] for details.
 **/
var ProcessedAsset = module.exports = function ProcessedAsset() {
  var Klass, context, result;

  Asset.apply(this, arguments);
  prop(this, 'type', 'processed');

  // prepare to build ourself
  Klass       = this.environment.ContextClass;
  context     = new Klass(this.environment, this.logicalPath, this.pathname);

  result          = context.evaluate(this.pathname);
  this.__source__ = result.data;
  this.sourceMap  = result.map;

  this.length = Buffer.byteLength(this.source);
  this.digest = this.environment.digest.update(this.source).digest('hex');

  buildRequiredAssets(this, context);
  buildDependencyPaths(this, context);

  prop(this, 'dependencyDigest', computeDependencyDigest(this));
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


// See apidoc of [[Asset#buffer]]
getter(ProcessedAsset.prototype, 'buffer', function () {
  return this.__buffer__ || new Buffer(this.source);
});


// See apidoc of [[Asset#source]]
getter(ProcessedAsset.prototype, 'source', function () {
  return this.__source__;
});


ProcessedAsset.prototype.encodeWith = function (hash) {
  Asset.prototype.encodeWith.call(this, hash);

  hash.source            = this.__source__;
  hash.sourceMap         = this.sourceMap;
  hash.dependencyDigest  = this.dependencyDigest;

  hash.requiredPaths = this.__requiredAssets__.map(function (asset) {
    return this.relativizeRootPath(asset.pathname);
  }, this);


  hash.dependencyPaths = this.__dependencyPaths__.map(function (dep) {
    return {
      path:   this.relativizeRootPath(dep.pathname),
      mtime:  dep.mtime.getTime(),
      digest: dep.digest
    };
  }, this);
};



ProcessedAsset.prototype.initWith = function (environment, hash) {
  Asset.prototype.initWith.call(this, environment, hash);

  this.__source__ = hash.source;
  this.sourceMap  = hash.sourceMap;

  prop(this, 'dependencyDigest', hash.dependencyDigest);

  prop(this, '__requiredAssets__', hash.requiredPaths.map(function (p) {
    var root;

    p     = this.expandRootPath(p);
    root  = _.detect(environment.paths, function (path) {
      return path === p.substr(0, path.length);
    }, this);

    if (!root) {
      throw {
        code:     'unserialize_error',
        message:  p + ' isn\'t in paths'
      };
    }

    return p === this.pathname ? this : environment.findAsset(p, { bundle: false });
  }, this));

  prop(this, '__dependencyPaths__', hash.dependencyPaths.map(function (h) {
    return new DependencyFile(this.expandRootPath(h.path), new Date(h.mtime), h.digest);
  }, this));
};
