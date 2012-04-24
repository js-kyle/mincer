'use strict';


module.exports.getter = function (obj, name, fn) {
  Object.defineProperty(obj, name, {get: fn});
};


module.exports.mixin = function (baseObj, superObj) {
  Object.getOwnPropertyNames(superObj).forEach(function (prop) {
    var descriptor = Object.getOwnPropertyDescriptor(superObj, prop);
    Object.defineProperty(baseObj, prop, descriptor);
  });
};
