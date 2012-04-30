/** internal
 *  class AssetAttributes
 **/


'use strict';


// stdlib
var path = require('path');


// 3rd-party
var _ = require('underscore');


// internal
var prop    = require('./common').prop;
var getter  = require('./common').getter;


/**
 *  new AssetAttributes()
 **/
var AssetAttributes = module.exports = function AssetAttributes(environment, path) {
  prop(this, 'environment', environment);
  prop(this, 'pathname',    path);
};


getter(AssetAttributes.prototype, 'searchPaths', function () {
  var paths = [this.pathname],
      exts  = this.extensions.join(""),
      path_without_extensions;

  if ('index' !== path.basename(this.pathname, exts)) {
    path_without_extensions = this.extensions.reduce(function (p, ext) {
      return p.replace(ext, '');
    }, this.pathname);
    paths.push(path.join(path_without_extensions, "index" + exts));
  }

  return paths;
});



getter(AssetAttributes.prototype, 'logicalPath', function () {
  var pathname = this.pathname, paths = this.environment.paths, root_path;

  root_path = _.detect(paths, function (root) {
    return root === pathname.substr(0, root.length);
  });

  if (!root_path) {
    throw new Error("File outside paths: " + pathname + " isn't in paths: " +
                    paths.join(", "));
  }

  pathname = pathname.replace(root_path + "/", "");
  pathname = this.engineExtensions.reduce(function (p, ext) {
    return p.replace(ext, "");
  }, pathname);

  if (this.formatExtension) {
    pathname += this.engineFormatExtension;
  }

  return pathname;
});


getter(AssetAttributes.prototype, 'extensions', function () {
  if (!this.__extensions__) {
    prop(this, '__extensions__', path.basename(this.pathname).split('.').slice(1).map(function (ext) {
      return "." + ext;
    }));
  }

  return this.__extensions__;
});


getter(AssetAttributes.prototype, 'formatExtension', function () {
  var env = this.environment;
  return _.detect(this.extensions, function (ext) {
    return env.mimeTypes(ext) && !env.engines(ext);
  });
});


getter(AssetAttributes.prototype, 'engineExtensions', function () {
  var env   = this.environment,
      exts  = _.without(this.extensions, this.formatExtension);

  return _.filter(exts, function (ext) { return !!env.engines(ext); });
});


getter(AssetAttributes.prototype, 'engines', function () {
  var env = this.environment;
  return this.engineExtensions.map(function (ext) { return env.engines(ext); });
});


getter(AssetAttributes.prototype, 'processors', function () {
  return [].concat(this.environment.preprocessors(this.contentType),
                   this.engines.reverse(),
                   this.environment.postprocessors(this.contentType));
});


getter(AssetAttributes.prototype, 'contentType', function () {
  if (!this.__contentType__) {
    prop(this, '__contentType__',
         (!this.formatExtension) ?
           (this.engineContentType || 'application/octet-stream')
         : (this.environment.mimeTypes(this.formatExtension) ||
            this.engineContentType || 'application/octet-stream'));
  }

  return this.__contentType__;
});


getter(AssetAttributes.prototype, 'engineContentType', function () {
  var engine = _.detect(this.engines.reverse(), function (engine) {
    return !!engine.defaultMimeType;
  });

  return (engine || {}).defaultMimeType;
});


getter(AssetAttributes.prototype, 'engineFormatExtension', function () {
  var type = this.engineContentType;
  if (type) {
    return this.environment.extensionForMimeType(type);
  }
});
