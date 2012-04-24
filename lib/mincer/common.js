'use strict';


// shorthand for defining getter properties
module.exports.getter = function (obj, name, fn) {
  Object.defineProperty(obj, name, {get: fn});
};


// _.extend implementation that copies descriptors as is
module.exports.mixin = function (baseObj, superObj) {
  Object.getOwnPropertyNames(superObj).forEach(function (prop) {
    var descriptor = Object.getOwnPropertyDescriptor(superObj, prop);
    Object.defineProperty(baseObj, prop, descriptor);
  });
};


// Normalize extension with a leading `.`.
module.exports.normalizeExtension = function (extension) {
  if ('.' === extension[0]) {
    return extension;
  }

  return '.' + extension;
};
