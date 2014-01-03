/**
 *  class FileStore
 *
 *  Cache backend that keeps assets cache on FS.
 *
 *  ##### Usage
 *
 *      env.cache = new FileStore('/path/to/cache');
 **/


////////////////////////////////////////////////////////////////////////////////


'use strict';


// stdlib
var fs      = require('fs');
var exists  = fs.existsSync;
var read    = fs.readFileSync;
var write   = fs.writeFileSync;
var path    = require('path');


// 3rd-party
var fstools = require('fs-tools');
var mkdir   = fstools.mkdirSync;


////////////////////////////////////////////////////////////////////////////////


/**
 *  new FileStore(root)
 *  - root (String): cache path root
 **/
var FileStore = module.exports = function FileStore(root) {
  this.root = path.resolve(root);
};



FileStore.prototype.get = function (key) {
  var dataFile = path.join(this.root, key),
      metaFile = path.join(this.root, key + '.json'),
      hash     = null;

  if (exists(metaFile)) {
    // using read + toString for backward compatibility
    hash = JSON.parse(read(metaFile).toString('utf8'));
    hash.source = read(dataFile).toString('utf8');
  }

  return hash;
};


FileStore.prototype.set = function (key, hash) {
  var dataFile = path.join(this.root, key),
      metaFile = path.join(this.root, key + '.json'),
      source   = hash.source || '';

  delete hash.source;

  mkdir(path.dirname(metaFile));
  write(metaFile, JSON.stringify(hash));
  write(dataFile, source);
};
