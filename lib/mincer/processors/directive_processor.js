/**
 *  class DirectiveProcessor
 *
 *  The `DirectiveProcessor` is responsible for parsing and evaluating
 *  directive comments in a source file.
 *
 *  A directive comment starts with a comment prefix, followed by an "=",
 *  then the directive name, then any arguments.
 *
 *  - **JavaScript one-line comments:**       `//= require "foo"
 *  - **CoffeeScript one-line comments:**     `#= require "baz"
 *  - **JavaScript and CSS block comments:**  `*= require "bar"
 *
 *  This behavior can be disabled with:
 *
 *      environment.unregisterPreProcessor('text/css', DirectiveProcessor);
 *      environment.unregisterPreProcessor('application/javascript', DirectiveProcessor);
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// stdlib
var path = require('path');


// 3rd-party
var _           = require('lodash');
var shellwords  = require('shellwords').split;


// internal
var Template    = require('../template');
var prop        = require('../common').prop;
var getter      = require('../common').getter;
var isAbsolute  = require('../common').isAbsolute;
var isRelative  = require('../common').isRelative;


////////////////////////////////////////////////////////////////////////////////


// Returns an Array of lines.
// Originl idea of cross-platform line splitting taken from Sugr.JS:
// https://github.com/andrewplummer/Sugar/blob/f6d1c2e9/lib/string.js#L323
function get_lines(str) {
  return String(str || '').match(/^.*$/gm);
}

// Directives will only be picked up if they are in the header
// of the source file. C style (/* */), JavaScript (//), and
// Ruby (#) comments are supported.
//
// Directives in comments after the first non-whitespace line
// of code will not be processed.
var HEADER_PATTERN = new RegExp(
  '^(?:\\s*' +
    '(' +
      '(?:\/[*](?:\\s*|.+?)*?[*]\/)' + '|' +
      '(?:\/\/.*\n?)+' + '|' +
      '(?:#.*\n?)+' +
    ')*' +
  ')*', 'm');


// Directives are denoted by a `=` followed by the name, then
// argument list.
//
// A few different styles are allowed:
//
//     // =require foo
//     //= require foo
//     //= require "foo"
//
var DIRECTIVE_PATTERN = new RegExp('^\\W*=\\s*(\\w+.*?)(\\*\\/)?$');


// Real directive processors
var DIRECTIVE_HANDLERS = {
  // The `require` directive functions similar to Ruby's `require`.
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
  require: function (self, args) {
    var pathname = isRelative(args[0]) ? args[0] : ('./' + args[0]);

    self.context.requireAsset(pathname);
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
  require_self: function (self/*, args*/) {
    if (self.__hasWrittenBody__) {
      throw new Error('require_self can only be called once per source file');
    }

    self.context.requireAsset(self.pathname);
    self.processSource();

    prop(self, '__hasWrittenBody__', true);
    self.includedPathnames = [];
  },


  // The `include` directive works similar to `require` but
  // inserts the contents of the dependency even if it already
  // has been required.
  //
  //     //= include "header"
  //
  include: function (self, args) {
    var pathname = self.context.resolve(args[0]);

    self.context.dependOnAsset(pathname);
    self.includedPathnames.push(pathname);
  },


  // `require_directory` requires all the files inside a single
  // directory. It's similar to `path/*` since it does not follow
  // nested directories.
  //
  //     //= require_directory "./javascripts"
  //
  require_directory: function (self, args) {
    var root, pathname = args[0] || '.', stat;

    if (isAbsolute(pathname)) {
      throw new Error('require_directory argument must be a relative path');
    }

    root = path.resolve(path.dirname(self.pathname), pathname);
    stat = self.stat(root);

    if (!stat || !stat.isDirectory()) {
      throw new Error('require_directory argument must be a directory');
    }

    self.context.dependOn(root);

    _.forEach(self.entries(root), function (pathname) {
      pathname = path.join(root, pathname);

      if (self.file === pathname) {
        return;
      } else if (self.context.isAssetRequirable(pathname)) {
        self.context.requireAsset(pathname);
      }
    });
  },


  // `require_tree` requires all the nested files in a directory.
  // Its glob equivalent is `path/**/*`.
  //
  //     //= require_tree "./public"
  //
  require_tree: function (self, args) {
    var root, pathname = args[0] || '.', stat;

    if (isAbsolute(pathname)) {
      throw new Error('require_tree argument must be a relative path');
    }

    root = path.resolve(path.dirname(self.pathname), pathname);
    stat = self.stat(root);

    if (!stat || !stat.isDirectory()) {
      throw new Error('require_tree argument must be a directory');
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
  depend_on: function (self, args) {
    self.context.dependOn(args[0]);
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
  depend_on_asset: function (self, args) {
    self.context.dependOnAsset(args[0]);
  },

  // Allows dependency to be excluded from the asset bundle.
  //
  // The `path` must be a valid asset and may or may not already
  // be part of the bundle. Once stubbed, it is blacklisted and
  // can't be brought back by any other `require`.
  //
  //     //= stub "jquery"
  //
  stub: function (self, args) {
    self.context.stubAsset(args[0]);
  }
};


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var DirectiveProcessor = module.exports = function DirectiveProcessor() {
  Template.apply(this, arguments);
};


require('util').inherits(DirectiveProcessor, Template);


// Run processor
DirectiveProcessor.prototype.evaluate = function (context/*, locals*/) {
  var self    = this,
      header  = (HEADER_PATTERN.exec(this.data) || []).shift() || '';

  // drop trailing spaces and line breaks
  header = header.trimRight();

  prop(this, 'pathname',            this.file);
  prop(this, 'header',              header);
  prop(this, 'body',                this.data.substr(header.length) + '\n');
  prop(this, 'includedPathnames',   [], {writable: true});

  prop(this, 'context',             context);
  prop(this, 'result',              '', {writable: true});

  self.processDirectives();
  self.processSource();

  return self.result;
};


/**
 *  DirectiveProcessor#processDirectives() -> Void
 *
 *  Executes handlers for found directives.
 *
 *  ##### See Also:
 *
 *  - [[DirectiveProcessor#directives]]
 **/
DirectiveProcessor.prototype.processDirectives = function () {
  var self = this;

  // Execute handler for each found directive
  _.forEach(this.directives, function (arr) {
    self.context.__LINE__ = arr[0];
    // arr = [
    //         10,         # 0: LINE
    //         'require',  # 1: DIRECTIVE
    //         ['foobar']  # 2: [ARGUMENTS]
    //       ]
    DIRECTIVE_HANDLERS[arr[1]](self, arr[2]);
    self.context.__LINE__ = null;
  });
};


DirectiveProcessor.prototype.processSource = function () {
  var self = this;

  // if our own body was not yet appended, and there are header comments,
  // prepend these coments first.
  if (!self.__hasWrittenBody__ && 0 < self.processedHeader.length) {
    self.result += self.processedHeader;
  }

  // process and append body of each path that should be included
  _.forEach(self.includedPathnames, function (pathname) {
    self.result += self.context.evaluate(pathname, {});
  });

  // append own body of source only, if it was not yet written
  // (with `require_self` directive).
  if (!self.__hasWrittenBody__) {
    self.result += self.body;
  }
};


// Tells whenever given line is directive or not by
// comparing found directives line indexes with `lineno`
function is_directive(directives, lineno) {
  return _.any(directives, function (arr) { return arr[0] === lineno; });
}


/**
 *  DirectiveProcessor#processedHeader -> String
 *
 *  Returns the header String with any directives stripped.
 **/
getter(DirectiveProcessor.prototype, 'processedHeader', function () {
  var header;

  if (!this.__processedHeader__) {
    header = get_lines(this.header).map(function (line, index) {
      return is_directive(this.directives, index + 1) ? '' : line;
    }, this).join('\n');

    prop(this, '__processedHeader__', header);
  }

  return this.__processedHeader__;
});


/**
 *  DirectiveProcessor#processedSource -> String
 *
 *  Returns the source String with any directives stripped.
 **/
getter(DirectiveProcessor.prototype, 'processedSource', function () {
  if (!this.__processedSource__) {
    this.__processedSource__ = this.processedHeader + this.body;
  }

  return this.__processedSource__;
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

    get_lines(this.header).forEach(function (line, index) {
      var matches = DIRECTIVE_PATTERN.exec(line), name, args;

      if (matches && matches[1]) {
        args = shellwords(matches[1]);
        name = args.shift();

        if (_.isFunction(DIRECTIVE_HANDLERS[name])) {
          this.__directives__.push([index + 1, name, args]);
        }
      }
    }, this);
  }

  return this.__directives__;
});


DirectiveProcessor.prototype.stat = function (pathname) {
  return this.context.environment.stat(pathname);
};


DirectiveProcessor.prototype.entries = function (pathname) {
  return this.context.environment.entries(pathname);
};


DirectiveProcessor.prototype.eachEntry = function (path, func) {
  return this.context.environment.eachEntry(path, func);
};
