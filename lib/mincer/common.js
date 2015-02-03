'use strict';


// stdlib
var path = require('path');


// 3rd-party
var _ = require('lodash');


////////////////////////////////////////////////////////////////////////////////


// shorthand for defining getter properties
module.exports.getter = function (obj, name, get) {
  Object.defineProperty(obj, name, { get: get });
};


// shorthand for defining data descriptors
module.exports.prop = function (obj, name, value, options) {
  var descriptor = _.assign({}, options, { value: value });
  Object.defineProperty(obj, name, descriptor);
};


// _.assign implementation that copies descriptors as is
module.exports.mixin = function (baseObj, superObj) {
  Object.getOwnPropertyNames(superObj).forEach(function (prop) {
    var descriptor = Object.getOwnPropertyDescriptor(superObj, prop);
    Object.defineProperty(baseObj, prop, descriptor);
  });
};


// Dummy alternative to Ruby's Pathname#is_absolute
module.exports.isAbsolute = function (pathname) {
  if (path.sep === '/') {
    // unix
    return pathname[0] === '/';
  }

  // win
  return pathname.indexOf(':') >= 0;
};


// Inverse of isAbsolute.
module.exports.isRelative = function (pathname) {
  return !module.exports.isAbsolute(pathname);
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
