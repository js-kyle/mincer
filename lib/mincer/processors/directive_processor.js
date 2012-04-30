'use strict';


// stdlib
var path = require('path');


// 3rd-party
var _ = require('underscore');
var async = require('async');


// internal
var EngineTemplate = require('../engine_template');
var prop           = require('../common').prop;
var getter         = require('../common').getter;
var shellwords     = require('../common').shellwords;


var HEADER_PATTERN = new RegExp(
  '^(?:\\s*' +
    '(' +
      '(?:\/[*](?:\\s*|.+?)*?[*]\/)' + '|' +
      '(?:\/\/.*\n?)+' + '|' +
      '(?:#.*\n?)+' +
    ')*' +
  ')*', 'm');


var DIRECTIVE_PATTERN = new RegExp('^[\\W]*=\\s*(\\w+.*?)([*]\/)?$');


var DirectiveProcessor = module.exports = function DirectiveProcessor() {
  EngineTemplate.apply(this, arguments);
};


require('util').inherits(DirectiveProcessor, EngineTemplate);


DirectiveProcessor.prototype.prepare = function () {
  var header = (HEADER_PATTERN.exec(this.data) || []).shift() || '';

  prop(this, 'pathname', this.file);
  prop(this, 'header', header);
  prop(this, 'body', this.data.substr(header.length) + "\n");
  prop(this, 'included_pathnames', []);
};



DirectiveProcessor.prototype.evaluate = function (context, locals, callback) {
  var self = this;

  prop(this, 'context', context);
  prop(this, 'result', '');

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
 *  directive name as the second element, followed by any
 *  arguments.
 *
 *      [[1, "require", "foo"], [2, "require", "bar"]]
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
          this.__directives__.push([index + 1, name].concat(args));
        }
      }
    }, this);
  }

  return this.__directives__;
});


function is_relative(path) {
  return (/^\.(?:$|\.?\/)/).test(path);
}



DirectiveProcessor.prototype.process_require_self_directive = function () {
  if (this.has_written_body) {
    throw new Error("require_self can only be called once per source file");
  }

  this.context.requireAsset(this.pathname);

  throw new Error("Not implemented yet");
};


DirectiveProcessor.prototype.process_include_directive = function (path) {
  var pathname = this.context.resolve(path);
  this.context.dependOnAsset(pathname);
  this.included_pathnames.push(pathname);
};


DirectiveProcessor.prototype.process_require_directory_directive = function (tree) {
  var self = this, root, stat;

  tree = tree || '.';

  if (!is_relative(tree)) {
    throw new Error("require_directory argument must be a relative path");
  }

  root = path.resolve(path.dirname(this.pathname), tree);
  stat = this.stat(root);

  if (!stat || !stat.isDirectory()) {
    throw new Error("require_directory argument must be a directory");
  }

  this.context.dependOn(root);
  _.each(this.entries(root), function (pathname) {
    pathname = path.join(root, pathname);

    if (self.file === pathname) {
      return;
    } else if (self.context.isAssetRequirable(pathname)) {
      self.context.requireAsset(pathname);
    }
  });
};


DirectiveProcessor.prototype.process_require_tree_directive = function (tree) {
  var self = this, root, stat;

  tree = tree || '.';

  if (!is_relative(tree)) {
    throw new Error("require_tree argument must be a relative path");
  }

  root = path.resolve(path.dirname(this.pathname), tree);
  stat = this.stat(root);

  if (!stat || !stat.isDirectory()) {
    throw new Error("require_tree argument must be a directory");
  }

  this.context.dependOn(root);
  this.eachEntry(root, function (pathname) {
    if (self.file === pathname) {
      return;
    } else if (self.stat(pathname).isDirectory()) {
      self.context.dependOn(pathname);
    } else if (self.context.isAssetRequirable(pathname)) {
      self.context.requireAsset(pathname);
    }
  });
};


/**
 *  DirectiveProcessor#process_depend_on_directive(path) -> Void
 *
 *  Allows you to state a dependency on a file without
 *  including it.
 *
 *  This is used for caching purposes. Any changes made to
 *  the dependency file will invalidate the cache of the
 *  source file.
 *
 *  This is useful if you are using ERB and File.read to pull
 *  in contents from another file.
 *
 *      //= depend_on "foo.png"
 **/
DirectiveProcessor.prototype.process_depend_on_directive = function (path) {
  this.context.dependOn(path);
};


/**
 *  DirectiveProcessor#process_depend_on_asset_directive(path) -> Void
 *  Allows you to state a dependency on an asset without including
 *  it.
 *
 *  This is used for caching purposes. Any changes that would
 *  invalid the asset dependency will invalidate the cache our the
 *  source file.
 *
 *  Unlike `depend_on`, the path must be a requirable asset.
 *
 *      //= depend_on_asset "bar.js"
 **/
DirectiveProcessor.prototype.process_depend_on_asset_directive = function (path) {
  this.context.dependOnAsset(path);
};


/** internal
 *  DirectiveProcessor#process_stub_directive(path) -> Void
 *
 *  Allows dependency to be excluded from the asset bundle.
 *
 *  The `path` must be a valid asset and may or may not already
 *  be part of the bundle. Once stubbed, it is blacklisted and
 *  can't be brought back by any other `require`.
 *
 *      //= stub "jquery"
 **/
DirectiveProcessor.prototype.process_stub_directive = function (path) {
  this.context.stubAsset(path);
};


DirectiveProcessor.prototype.stat = function (path) {
  return this.context.environment.stat(path);
};


DirectiveProcessor.prototype.entries = function (path) {
  return this.context.environment.entries(path);
};


DirectiveProcessor.prototype.eachEntry = function (path, func) {
  return this.context.environment.eachEntry(path, func);
};
