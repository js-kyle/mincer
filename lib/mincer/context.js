/** internal
 *  class Context
 *
 *  `Context` provides helper methods to all [[Template]] processors.
 *  They are typically accessed by EJS templates. You can mix in custom
 *  helpers by injecting them into [[Environment#ContextClass]]. Do not
 *  mix them into `Context` directly.
 *
 *      environment.registerHelper('asset_url', function () {
 *        // ...
 *      });
 *
 *      // or in batch-mode
 *      environment.registerHelper({
 *        asset_url: function () {
 *          // ...
 *        },
 *        // ...
 *      });
 *
 *      <%= asset_url('foo.png') %>
 *
 *  The `Context` also collects dependencies declared by assets.
 *  See [[DirectiveProcessor]] for an example of this.
 **/


'use strict';


// stdlib
var fs        = require('fs');
var path      = require('path');
var inherits  = require('util').inherits;


// 3rd-party
var _         = require('lodash');

// internal
var getter     = require('./common').getter;
var prop       = require('./common').prop;
var isAbsolute = require('./common').isAbsolute;
var sourcemap  = require('source-map');


////////////////////////////////////////////////////////////////////////////////


/**
 *  new Context(environment, logicalPath, pathname)
 *  - environment (Environment)
 *  - logicalPath (String)
 *  - pathname (String)
 **/
var Context = module.exports = function Context(environment, logicalPath, pathname) {
  prop(this, 'environment',           environment);
  prop(this, 'pathname',              pathname);

  prop(this, '__logicalPath__',       logicalPath);

  prop(this, '__requiredPaths__',     []);
  prop(this, '__stubbedAssets__',     []);
  prop(this, '__dependencyPaths__',   []);
  prop(this, '__dependencyAssets__',  [ pathname ]);
};


// Hash of helpers available as locals in the renderers.
// For each helper, a wrapper will be generated to preserve `this` context.
//
// See Context.registerHelper()
prop(Context.prototype, '__helpers__', {});


/**
 *  Context#assetPath(pathname, options) -> String
 *
 *  Helper that returns path to asset and that acts like a 'base' method for
 *  other `*Path` helpers.
 *
 *  Exposed to the engines as `asset_path` helper.
 *
 *  By default this method is not implemented, and you must provide it's
 *  implementation that will fit your needs, e.g.:
 *
 *      environment.ContextClass.defineAssetPath(function (pathname, options) {
 *        var asset = this.environment.findAsset(pathname, options);
 *        return '/assets/' + asset.digestPath;
 *      });
 *
 *  Once implemented, you can use `asset_path` helper, e.g.:
 *
 *      #logo { background: url(<%= asset_path('logo.png') %>) }
 **/
Context.prototype.assetPath = function assetPath() {
  throw new Error(
    'Custom asset_path helper is not implemented\n\n' +
    'Extend your environment context with a custom method.\n\n' +
    '  environment.ContextClass.defineAssetPath(function (pathname, options) {\n' +
    '    // ... your code here ... \n' +
    '  });'
  );
};


/**
 *  Context#imagePath(pathname) -> String
 *
 *  Wrapper over [[Context#assetPath]] for image assets.
 *  Exposed to the engines as `image_path` helper.
 **/

/**
 *  Context#videoPath(pathname) -> String
 *
 *  Wrapper over [[Context#assetPath]] for video assets.
 *  Exposed to the engines as `video_path` helper.
 **/

/**
 *  Context#audioPath(pathname) -> String
 *
 *  Wrapper over [[Context#assetPath]] for audio assets.
 *  Exposed to the engines as `audio_path` helper.
 **/

/**
 *  Context#fontPath(pathname) -> String
 *
 *  Wrapper over [[Context#assetPath]] for font assets.
 *  Exposed to the engines as `font_path` helper.
 **/

/**
 *  Context#javascriptPath(pathname) -> String
 *
 *  Wrapper over [[Context#assetPath]] for javascript assets.
 *  Exposed to the engines as `javascript_path` helper.
 **/

/**
 *  Context#stylesheetPath(pathname) -> String
 *
 *  Wrapper over [[Context#assetPath]] for stylesheet assets.
 *  Exposed to the engines as `stylesheet_path` helper.
 **/

[ 'image', 'video', 'audio', 'font', 'javascript', 'stylesheet' ].forEach(function (assetType) {
  Context.prototype[assetType + 'Path'] = function (pathname) {
    return this.assetPath(pathname, { type: assetType });
  };
  Context.prototype[assetType + 'Url'] = function(pathname) {
    return "url('" + this.assetPath(pathname, {type: assetType}) + "')";
  };
});


/**
 *  Context#rootPath -> String
 *
 *  Returns the environment path that contains the file.
 *
 *  If `app/javascripts` and `app/stylesheets` are in your path, and
 *  current file is `app/javascripts/foo/bar.js`, `root_path` would
 *  return `app/javascripts`.
 **/
getter(Context.prototype, 'rootPath', function () {
  var pathname = this.pathname;

  return _.find(this.environment.paths, function (path) {
    return pathname.substr(0, path.length) === path;
  }).substr(this.environment.root.length + 1);
});



/**
 * Context#logicalPath -> String
 *
 *  Returns logical path without any file extensions.
 *
 *      'app/javascripts/application.js'
 *      # => 'app/javascripts/application'
 **/
getter(Context.prototype, 'logicalPath', function () {
  var len = this.__logicalPath__.length, ext = path.extname(this.__logicalPath__);
  return this.__logicalPath__.substr(0, len - ext.length);
});


/**
 *  Context#contentType -> String
 *
 *  Returns content type of file
 *
 *      'application/javascript'
 *      'text/css'
 **/
getter(Context.prototype, 'contentType', function () {
  return this.environment.contentTypeOf(this.pathname);
});


/**
 *  Context#context -> Context
 *
 *  Returns the context itself.
 **/
getter(Context.prototype, 'context', function () {
  return this;
});


/**
 *  Context#relativePath -> String
 *
 *  Returns AssetAttributes#relativePath of current file.
 **/
getter(Context.prototype, 'relativePath', function () {
  return this.environment.attributesFor(this.pathname).relativePath;
});


/**
 *  Context#resolve(pathname[, options = {}[, fn]]) -> String
 *  - pathname (String)
 *  - options (Object)
 *  - fn (Function)
 *
 *  Given a logical path, `resolve` will find and return the fully
 *  expanded path. Relative paths will also be resolved. An optional
 *  `contentType` restriction can be supplied to restrict the
 *  search.
 *
 *      context.resolve('foo.js')
 *      # => '/path/to/app/javascripts/foo.js'
 *
 *      context.resolve('./bar.js')
 *      # => '/path/to/app/javascripts/bar.js'
 *
 *      context.resolve('foo', {contentType: 'application/javascript'})
 *      # => '/path/to/app/javascripts/foo.js'
 *
 *  You may also provide an iterator function `fn`, that wil be passed to
 *  environments [[Base#resolve]] when needed.
 **/
Context.prototype.resolve = function (pathname, options, fn) {
  var self = this, attributes, content_type, resolved;

  options = options || {};

  // If the pathname is absolute, check it existence
  if (isAbsolute(pathname)) {
    if (fs.existsSync(pathname)) {
      return pathname;
    }

    throw new Error('Couldn\'t find file \'' + pathname + '\'');
  }

  content_type = options.contentType;

  if (content_type) {
    if (content_type === '~self~') {
      content_type = self.contentType;
    }

    attributes = this.environment.attributesFor(pathname);
    if (attributes.formatExtension && content_type !== attributes.contentType) {
      throw new Error(pathname + ' is \'' + attributes.contentType + '\', ' +
                      'not \'' + content_type + '\'');
    }

    resolved = this.resolve(pathname, {}, function (candidate) {
      if (self.contentType === self.environment.contentTypeOf(candidate)) {
        return candidate;
      }
    });

    if (!resolved) {
      throw new Error('Could not find file \'' + pathname + '\'.');
    }

    return resolved;
  }

  return this.environment.resolve(pathname, _.assign({
    basePath: path.dirname(this.pathname)
  }, options), fn);
};


/**
 *  Context#dependOn(pathname) -> Void
 *
 *  Allows you to state a dependency on a file without including it.
 *
 *  This is used for caching purposes. Any changes made to
 *  the dependency file with invalidate the cache of the
 *  source file.
 **/
Context.prototype.dependOn = function (pathname) {
  this.__dependencyPaths__.push(this.resolve(pathname));
};


/**
 *  Context#dependOnAsset(pathname) -> Void
 *
 *  Allows you to state an asset dependency without including it.
 *
 *  This is used for caching purposes. Any changes that would
 *  invalidate the dependency asset will invalidate the source
 *  file. Unlike [[Context#dependOn]], this will include recursively
 *  the target asset's dependencies.
 **/
Context.prototype.dependOnAsset = function (pathname) {
  this.__dependencyAssets__.push(this.resolve(pathname));
};


/**
 *  Context#requireAsset(pathname) -> Void
 *
 *  `requireAsset` declares `path` as a dependency of the file. The
 *  dependency will be inserted before the file and will only be
 *  included once.
 *
 *  If EJS processing is enabled, you can use it to dynamically
 *  require assets.
 *
 *      <%= requireAsset("#{framework}.js") %>
 **/
Context.prototype.requireAsset = function (pathname) {
  pathname = this.resolve(pathname, { contentType: '~self~' });
  this.dependOnAsset(pathname);
  this.__requiredPaths__.push(pathname);
};


/**
 *  Context#stubAsset(pathname) -> Void
 *
 *  `stubAsset` blacklists `pathname` from being included in the bundle.
 *  `pathname` must be an asset which may or may not already be included
 *  in the bundle.
 **/
Context.prototype.stubAsset = function (pathname) {
  this.__stubbedAssets__.push(this.resolve(pathname, { contentType: '~self~' }));
};


/**
 *  Context#isAssetRequirable(pathname) -> Boolean
 *
 *  Tests if target path is able to be safely required into the
 *  current concatenation.
 **/
Context.prototype.isAssetRequirable = function (pathname) {
  var content_type, stat;

  pathname      = this.resolve(pathname);
  content_type  = this.environment.contentTypeOf(pathname);
  stat          = this.environment.stat(pathname);

  return stat && stat.isFile() &&
         (!this.contentType || this.contentType === content_type);
};


/**
 *  Context#assetDataUri(pathname) -> String
 *
 *  Returns a Base64-encoded `data:` URI with the contents of the
 *  asset at the specified path, and marks that path as a dependency
 *  of the current file.
 *
 *  Use `assetDataUri` from EJS with CSS or JavaScript assets:
 *
 *      #logo { background: url(<%= asset_data_uri('logo.png') %>) }
 *
 *      $('<img>').attr('src', '<%= asset_data_uri('avatar.jpg') %>')
 **/
Context.prototype.assetDataUri = function (pathname) {
  var asset, buffer;

  this.dependOn(pathname);

  asset  = this.environment.findAsset(pathname);
  buffer = asset.buffer || new Buffer(asset.toString());

  return 'data:' + asset.contentType + ';base64,' + buffer.toString('base64');
};


// internal
// Annotates exception raisen by the engine/processor
Context.prototype.annotateError = function(err, klass) {
  var prefix    = String(klass.__name__ || klass.name || ''),
      location  = String(this.pathname);

  if (this.__LINE__) {
    location += ':' + this.__LINE__;
  }

  if (prefix) {
    prefix = '[' + prefix + '] ';
  }

  err.message = prefix + err.message + '  (in ' + location + ')';
  err.type = 'MINCER_PROCESSOR';

  return err;
};


/**
 *  Context#evaluate(pathname, options = {}, callback) -> String
 *  - pathname (String)
 *  - options (Object)
 *
 *  Reads `pathname` and runs processors on the file.
 **/
Context.prototype.evaluate = function (pathname, options) {
  var self = this, locals = {}, attributes, processors, data, map;

  options     = options || {};
  pathname    = this.resolve(pathname);
  attributes  = this.environment.attributesFor(pathname);
  processors  = options.processors || attributes.processors;

  data      = options.data || fs.readFileSync(pathname, 'utf8');
  map       = options.map || '';


  _.forEach(this.__helpers__, function (payload, name) {
    var helper = payload.helper;

    if (typeof helper === 'function' && payload.options.type !== 'stylus') {
      helper = helper.bind(self);
    }

    locals[name] = helper;
  });


  _.forEach(processors, function (ProcessorKlass, idx) {
    var template;

    try {
      template  = new ProcessorKlass(pathname, data, map, processors[idx + 1]);
      var res = template.evaluate(self, locals);
      data = template.data;
      map  = template.map;
      // legacy compat, for old third party engines
      if (res) { data = res; }

    } catch (err) {
      throw self.annotateError(err, ProcessorKlass);
    }
  });

  return { data: data, map: map };
};



// internal helper to define registerHelper() method on destination class
function define_helpers_registrator(Klass) {
  Klass.registerHelper = function (name, helper, options) {
    // Scenario: registerHelper('foo', foo_helper[, foo_opts]);
    if (_.isString(name)) {
      Klass.prototype[name]             = helper;
      Klass.prototype.__helpers__[name] = {
        helper:   helper,
        options:  Object(options)
      };
      return;
    }

    // Scenario: registerHelper({ foo: foo_helper, ... });
    _.forEach(name, function (helper, name) {
      Klass.registerHelper(name, helper);
    });
  };
}



/**
 *  Context.registerHelper(name, func) -> Void
 *  Context.registerHelper(helpers) -> Void
 *  - name (String)
 *  - func (Function)
 *  - helpers (Object)
 *
 *  Register a helper that will be available in the engines that supports
 *  local helpers (e.g. EJS or Stylus). You should avoid registering helpers
 *  directly on `Context` class in favour of [[Environment#ContextClass]]
 *  (see [[Environment#registerHelper]] as well).
 *
 *  ##### Example
 *
 *      Context.registerHelper('foo', foo_helper);
 *      Context.registerHelper('bar', bar_helper);
 *
 *      // equals to
 *
 *      Context.registerHelper({
 *        foo: foo_helper,
 *        bar: bar_helper
 *      });
 **/
define_helpers_registrator(Context);


// Register all standard (built-in) helpers
Context.registerHelper({
  'asset_data_uri':   Context.prototype.assetDataUri,
  'asset_path':       Context.prototype.assetPath
});

['image', 'video', 'audio', 'font', 'javascript', 'stylesheet'].forEach(function(assetType) {
  Context.registerHelper(assetType + '_path', Context.prototype[assetType + 'Path']);
  Context.registerHelper(assetType + '_url', Context.prototype[assetType + 'Url']);
});

/**
 *  Context.defineAssetPath(func) -> Void
 *
 *  Syntax sugar that provides an easy way to set real implementation of
 *  `assetPath` and propose it to helpers.
 *
 *  ##### Example:
 *
 *      Context.defineAssetPath(function (pathname, options) {
 *        var asset = this.environment.findAsset(pathname, options);
 *        return '/assets/' + asset.digestPath;
 *      });
 **/
Context.defineAssetPath = function (func) {
  this.prototype.assetPath = func;
  this.registerHelper('asset_path', func);
};


/** internal
 *  Context#subclass -> Function
 *
 *  Returns new subclass of [[Context]].
 **/
getter(Context, 'subclass', function () {
  var Klass = function () { Context.apply(this, arguments); };

  // add class inheritance
  inherits(Klass, Context);

  // re-expose syntax sugar for custom asset_path helper setter
  Klass.defineAssetPath = Context.defineAssetPath;

  // clone some own-prototype properties
  prop(Klass.prototype, '__helpers__', _.clone(Context.prototype.__helpers__));

  // Provide helpers registrator
  define_helpers_registrator(Klass);

  return Klass;
});


// Just a helper, that can be convenient for external engines/processors
// Return existing sourcemap (obj.map) with clear sourceRoot, or create
// dummy one from obj.data & obj.file
//
// Required for late map init, because some engines do not support mapping.
//
Context.prototype.createSourceMapObject = function (obj) {
  var map;

  if (obj.map) {
    map = JSON.parse(obj.map);
    map.sourceRoot = '';
    return map;
  }

  var name = path.basename(obj.file);
  var smg = new sourcemap.SourceMapGenerator({ file: name });

  obj.data.split('\n').forEach(function (line, idx) {
    smg.addMapping({
      source: name,
      original: { line: idx + 1, column: 0 },
      generated: { line: idx + 1, column: 0 }
    });
  });
  smg.setSourceContent(name, obj.data);

  map = smg.toJSON();
  map.sourceRoot = '';

  return map;
};
