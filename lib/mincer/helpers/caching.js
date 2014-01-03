/** internal
 *  mixin Caching
 *
 *  An internal mixin whose public methods are exposed on the [[Environment]]
 *  and [[Index]] classes.
 **/


////////////////////////////////////////////////////////////////////////////////


'use strict';


// stdlib
var join    = require('path').join;
var crypto  = require('crypto');


// internal
var Asset = require('../assets/asset');


////////////////////////////////////////////////////////////////////////////////


function expandKey(self, key) {
  key = String(key).replace(self.root, '');
  key = crypto.createHash('md5').update(key, 'utf8').digest('hex');
  return join('mincer', key);
}


function cacheSet(self, key, hash) {
  hash._version = self.digest.digest('hex');
  self.cache.set(expandKey(self, key), hash);
}


function cacheGet(self, key) {
  var hash = self.cache.get(expandKey(self, key));
  if (hash && hash._version === self.digest.digest('hex')) {
    return hash;
  }
}


module.exports.cacheAsset = function (path, fn) {
  var asset, hash;

  if (!this.cache) {
    return fn();
  }

  asset = Asset.fromHash(this, cacheGet(this, path));
  if (asset && asset.isFresh(this)) {
    return asset;
  }

  asset = fn();
  if (asset) {
    hash = {};
    asset.encodeWith(hash);

    // Save the asset to its path
    cacheSet(this, path, hash);

    // Since path maybe a logical or full pathname, save the
    // asset its its full path too
    if (path !== asset.pathname) {
      cacheSet(this, asset.pathname, hash);
    }

    return asset;
  }
};
