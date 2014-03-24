'use strict';


// stdlib
var path = require('path');


// 3rd-party
var _         = require('lodash');
var Mimoza    = require('mimoza');


////////////////////////////////////////////////////////////////////////////////


// shorthand for defining getter properties
module.exports.getter = function (obj, name, get) {
  Object.defineProperty(obj, name, {get: get});
};


// shorthand for defining data descriptors
module.exports.prop = function (obj, name, value, options) {
  var descriptor = _.extend({}, options, {value: value});
  Object.defineProperty(obj, name, descriptor);
};


// _.extend implementation that copies descriptors as is
module.exports.mixin = function (baseObj, superObj) {
  Object.getOwnPropertyNames(superObj).forEach(function (prop) {
    var descriptor = Object.getOwnPropertyDescriptor(superObj, prop);
    Object.defineProperty(baseObj, prop, descriptor);
  });
};


// Normalize extension with a leading `.`.
//
//  js          -> .js
//  foo.js      -> .js
//  foo/bar.js  -> .js
module.exports.normalizeExtension = function (extension) {
  return path.extname('foobar.' + path.basename(extension));
};


// Dummy alternative to Ruby's Pathname#is_absolute
module.exports.isAbsolute = function (pathname) {
  if ('/' === path.sep) {
    // unix
    return '/' === pathname[0];
  }

  // win
  return 0 <= pathname.indexOf(':');
};


// Inverse of isAbsolute.
module.exports.isRelative = function (pathname) {
  return !module.exports.isAbsolute(pathname);
};


// Returns cloned Mimoza instance
module.exports.cloneMimeTypes = function (base) {
  var obj = new Mimoza({
    defaultType:  base.defaultType,
    normalize:    base.normalize
  });

  _.extend(obj.types,      base.types);
  _.extend(obj.extensions, base.extensions);

  return obj;
};


// Dummy timer helper
module.exports.timer = function () {
  return {
    start: Date.now(),
    stop: function () {
      return Date.now() - this.start;
    }
  };
};


// use High Resolution timers for Node >= 0.7.6
if (process.hrtime) {
  module.exports.timer = function () {
    return {
      start: process.hrtime(),
      stop: function () {
        var tuple = process.hrtime(this.start);
        return parseInt(tuple.shift() * 1000 + tuple.pop() / 1000000, 10);
      }
    };
  };
}


// cached empty function
module.exports.noop = function noop() {};
