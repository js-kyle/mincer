'use strict';


// 3rd-party
var _ = require('underscore');
var mime  = require('mime');


// shorthand for defining getter properties
module.exports.getter = function (obj, name, fn) {
  Object.defineProperty(obj, name, {get: fn});
};


// shorthand for defining data descriptors
module.exports.prop = function (obj, name, val) {
  Object.defineProperty(obj, name, {value: val});
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



// parse string in a BASH style
// inspired by Shellwords module of Ruby
var SHELLWORDS_PATTERN = /\s*(?:([^\s\\\'\"]+)|'((?:[^\'\\]|\\.)*)'|"((?:[^\"\\]|\\.)*)")/;
module.exports.shellwords = function (line) {
  var words = [], match, field;

  while (line) {
    match = SHELLWORDS_PATTERN.exec(line);

    if (!match || !match[0]) {
      line = false;
    } else {
      line  = line.substr(match[0].length);
      field = (match[1] || match[2] || match[3] || '').replace(/\\(.)/, '$1');

      words.push(field);
    }
  }

  return words;
};


// Dummy alternative to Ruby's Pathname#is_absolute
var ABSOLUTE_PATH_PATTERN = /^\//;
module.exports.isAbsolute = function (pathname) {
  return ABSOLUTE_PATH_PATTERN.test(pathname);
};



module.exports.cloneMimeTypes = function (base) {
  var obj = new (mime.Mime)({
    loadBuiltins: true,
    defaultType:  base.default_type,
    normalize:    base.normalize
  });

  obj.types       = _.clone(base.types);
  obj.extensions  = _.clone(base.extensions);

  return obj;
};
