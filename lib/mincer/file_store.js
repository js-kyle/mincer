/**
 *  class FileStore
 *
 *  Cache backend that keeps assets cache on FS.
 *
 *  ##### Usage
 *
 *      env.cache = new FileStore("/path/to/cache");
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
  var file = path.join(this.root, key);
  // using read + toString for backward compatibility when options was a string
  return exists(file) ? JSON.parse(read(file).toString("utf8")) : null;
};


FileStore.prototype.set = function (key, val) {
  var file = path.join(this.root, key);
  mkdir(path.dirname(file));
  write(file, JSON.stringify(val));
};
