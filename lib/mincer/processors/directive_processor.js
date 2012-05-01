'use strict';


// stdlib
var path = require('path');


// 3rd-party
var _ = require('underscore');
var async = require('async');


// internal
var Template    = require('../template');
var prop        = require('../common').prop;
var getter      = require('../common').getter;
var shellwords  = require('../common').shellwords;
var isAbsolute  = require('../common').isAbsolute;
var isRelative  = require('../common').isRelative;


////////////////////////////////////////////////////////////////////////////////


// RegExp matching the very first comment block.
// only whitespaces are allowed to be in front of it.
var HEADER_PATTERN = new RegExp(
  '^(?:\\s*' +
    '(' +
      '(?:\/[*](?:\\s*|.+?)*?[*]\/)' + '|' +
      '(?:\/\/.*\n?)+' + '|' +
      '(?:#.*\n?)+' +
    ')*' +
  ')*', 'm');


// RegExp matching directive, e.g. `//= require foobar`
var DIRECTIVE_PATTERN = new RegExp('^[\\W]*=\\s*(\\w+.*?)([*]\/)?$');


var DIRECTIVE_HANDLERS = {
  // The `require` directive functions similar to Ruby's own `require`.
  // It provides a way to declare a dependency on a file in your path
  // and ensures its only loaded once before the source file.
  //
  // `require` works with files in the environment path:
  //
  //     //= require "foo.js"
  //
  // Extensions are optional. If your source file is ".js", it
  // assumes you are requiring another ".js".
  //
  //     //= require "foo"
  //
  // Relative paths work too. Use a leading `./` to denote a relative
  // path:
  //
  //     //= require "./bar"
  //
  require: function (self, args, next) {
    var pathname = isRelative(args[0]) ? args[0] : ('./' + args[0]);
    self.context.requireAsset(pathname);
    next();
  },

  // `require_self` causes the body of the current file to be
  // inserted before any subsequent `require` or `include`
  // directives. Useful in CSS files, where it's common for the
  // index file to contain global styles that need to be defined
  // before other dependencies are loaded.
  //
  //     /*= require "reset"
  //      *= require_self
  //      *= require_tree .
  //      */
  //
  require_self: function (self, args, next) {
    if (self.has_written_body) {
      next(new Error("require_self can only be called once per source file"));
      return;
    }

    self.context.requireAsset(this.pathname);
    self.processSource(function (err) {
      if (err) {
        next(err);
        return;
      }

      prop(self, 'has_written_body', true);
      self.included_pathnames = [];

      next();
    });
  },


  // The `include` directive works similar to `require` but
  // inserts the contents of the dependency even if it already
  // has been required.
  //
  //     //= include "header"
  //
  include: function (self, args, next) {
    var pathname = self.context.resolve(args[0]);
    self.context.dependOnAsset(pathname);
    self.included_pathnames.push(pathname);
    next();
  },


  // `require_directory` requires all the files inside a single
  // directory. It's similar to `path/*` since it does not follow
  // nested directories.
  //
  //     //= require_directory "./javascripts"
  //
  require_directory: function (self, args, next) {
    var root, pathname = args[0] || '.', stat;

    if (isAbsolute(pathname)) {
      throw new Error("require_directory argument must be a relative path");
    }

    root = path.resolve(path.dirname(this.pathname), pathname);
    stat = self.stat(root);

    if (!stat || !stat.isDirectory()) {
      next(new Error("require_directory argument must be a directory"));
      return;
    }

    self.context.dependOn(root);
    _.each(this.entries(root), function (pathname) {
      pathname = path.join(root, pathname);

      if (self.file === pathname) {
        return;
      } else if (self.context.isAssetRequirable(pathname)) {
        self.context.requireAsset(pathname);
      }
    });

    next();
  },


  // `require_tree` requires all the nested files in a directory.
  // Its glob equivalent is `path/**/*`.
  //
  //     //= require_tree "./public"
  //
  require_tree: function (self, args, next) {
    var root, pathname = args[0] || '.', stat;

    if (isAbsolute(pathname)) {
      next(new Error("require_tree argument must be a relative path"));
      return;
    }

    root = path.resolve(path.dirname(self.pathname), pathname);
    stat = self.stat(root);

    if (!stat || !stat.isDirectory()) {
      next(new Error("require_tree argument must be a directory"));
      return;
    }

    self.context.dependOn(root);
    self.eachEntry(root, function (pathname) {
      if (self.file === pathname) {
        return;
      } else if (self.stat(pathname).isDirectory()) {
        self.context.dependOn(pathname);
      } else if (self.context.isAssetRequirable(pathname)) {
        self.context.requireAsset(pathname);
      }
    });

    next();
  },


  // Allows you to state a dependency on a file without
  // including it.
  //
  // This is used for caching purposes. Any changes made to
  // the dependency file will invalidate the cache of the
  // source file.
  //
  // This is useful if you are using ERB and File.read to pull
  // in contents from another file.
  //
  //     //= depend_on "foo.png"
  //
  depend_on: function (self, args, next) {
    self.context.dependOn(args[0]);
    next();
  },

  // Allows you to state a dependency on an asset without including
  // it.
  //
  // This is used for caching purposes. Any changes that would
  // invalid the asset dependency will invalidate the cache our the
  // source file.
  //
  // Unlike `depend_on`, the path must be a requirable asset.
  //
  //     //= depend_on_asset "bar.js"
  //
  depend_on_asset: function (self, args, next) {
    self.context.dependOnAsset(args[0]);
    next();
  },

  // Allows dependency to be excluded from the asset bundle.
  //
  // The `path` must be a valid asset and may or may not already
  // be part of the bundle. Once stubbed, it is blacklisted and
  // can't be brought back by any other `require`.
  //
  //     //= stub "jquery"
  //
  stub: function (self, args, next) {
    self.context.stubAsset(args[0]);
    next();
  }
};


////////////////////////////////////////////////////////////////////////////////


var DirectiveProcessor = module.exports = function DirectiveProcessor() {
  Template.apply(this, arguments);
};


require('util').inherits(DirectiveProcessor, Template);


DirectiveProcessor.prototype.prepare = function () {
  var header = (HEADER_PATTERN.exec(this.data) || []).shift() || '';

  prop(this, 'pathname',            this.file);
  prop(this, 'header',              header);
  prop(this, 'body',                this.data.substr(header.length) + "\n");
  prop(this, 'included_pathnames',  []);
};


DirectiveProcessor.prototype.evaluate = function (context, locals, callback) {
  var self = this;

  prop(this, 'context', context);
  prop(this, 'result',  '');

  async.series(
    [
      function (next) { self.processDirectives(next); },
      function (next) { self.processSource(next); },
    ],
    function (err) {
      callback(err, self.result);
    }
  );
};


DirectiveProcessor.prototype.processDirectives = function (callback) {
  var self = this;

  async.mapSeries(this.directives, function (arr, next) {
    self.context.__LINE__ = arr[0];
    DIRECTIVE_HANDLERS[arr[1]](self, arr[2], function (err) {
      self.context.__LINE__ = null;
      next(err);
    });
  }, callback);
};


DirectiveProcessor.prototype.processSource = function (callback) {
  var self = this;

  if (!self.has_written_body && 0 < self.processedHeader.length) {
    self.result += self.processedHeader + "\n";
  }

  async.forEachSeries(self.included_pathnames, function (pathname) {
    self.result += self.context.evaluate(pathname);
  }, function (err) {
    if (!self.has_written_body) {
      self.result += self.body;
    }

    callback(err);
  });
};


function is_directive(directives, lineno) {
  return _.any(directives, function (arr) { return arr[0] === lineno; });
}

/**
 *  DirectiveProcessor#processedHeader -> String
 *
 *  Returns the header String with any directives stripped.
 **/
getter(DirectiveProcessor.prototype, 'processedHeader', function () {
  if (!this.__processed_header__) {
    this.__processed_header__ = this.header.split(/\n/).map(function (line, index) {
      return is_directive(this.directives, index + 1) ? "\n" : line;
    }, this).join("\n").trimLeft().trimRight();
  }

  return this.__processed_header__;
});


/**
 *  DirectiveProcessor#processedSource -> String
 *
 *  Returns the source String with any directives stripped.
 **/
getter(DirectiveProcessor.prototype, 'processedSource', function () {
  if (!this.__processed_source__) {
    this.__processed_source__ = this.processedHeader + this.body;
  }

  return this.__processed_source__;
});


/**
 *  DirectiveProcessor#directives -> Array
 *
 *  Returns an Array of directive structures. Each structure
 *  is an Array with the line number as the first element, the
 *  directive name as the second element, third is an array of
 *  arguments.
 *
 *      [[1, "require", ["foo"]], [2, "require", ["bar"]]]
 **/
getter(DirectiveProcessor.prototype, 'directives', function () {
  if (!this.__directives__) {
    prop(this, '__directives__', []);

    this.header.split(/\n/).forEach(function (line, index) {
      var matches = DIRECTIVE_PATTERN.exec(line), name, args;

      if (matches && matches[1]) {
        args = shellwords(matches[1]);
        name = args.shift();

        if (_.isFunction(this["process_" + name + "_directive"])) {
          this.__directives__.push([index + 1, name, args]);
        }
      }
    }, this);
  }

  return this.__directives__;
});


DirectiveProcessor.prototype.stat = function (path) {
  return this.context.environment.stat(path);
};


DirectiveProcessor.prototype.entries = function (path) {
  return this.context.environment.entries(path);
};


DirectiveProcessor.prototype.eachEntry = function (path, func) {
  return this.context.environment.eachEntry(path, func);
};
