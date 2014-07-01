/**
 *  Mincer
 *
 *  This is a main entry point of the module (an object that you get by calling
 *  `require('mincer')`. You can get acces to some of the internal classes using
 *  this object.
 *
 *      var env = new (require('mincer').Environment)(__dirname);
 *
 *  `Mincer` depends on some 3rd-party modules. Most valueble (for understanding
 *  an API) are:
 *
 *  - [Hike](http://nodeca.github.com/hike-js/)
 *  - [Mimoza](http://nodeca.github.com/mimoza/)
 *
 *
 *  ##### EXTENDED BY
 *
 *  - [[Engines]]
 *  - [[Mime]]
 *  - [[Processing]]
 *  - [[Paths]]
 **/


'use strict';


// Node < 0.8 shims
var fs    = require('fs');
var path  = require('path');

fs.exists     = fs.exists || path.exists;
fs.existsSync = fs.existsSync || path.existsSync;

path.sep = path.sep || (path.resolve('.')[0] === '/' ? '/' : '\\');


// 3rd-party
var Mimoza  = require('mimoza');
var Trail   = require('hike').Trail;


// internal
var mixin = require('./mincer/common').mixin;
var prop  = require('./mincer/common').prop;
var Hash  = require('./mincer/common/hash');


var Mincer = module.exports = {};


// Engines /////////////////////////////////////////////////////////////////////


/**
 *  Mincer.EjsEngine -> EjsEngine
 **/
Mincer.EjsEngine          = require('./mincer/engines/ejs_engine');


/**
 *  Mincer.HandlebarsEngine -> HandlebarsEngine
 **/
Mincer.HandlebarsEngine   = require('./mincer/engines/handlebars_engine');


/**
 *  Mincer.JadeEngine -> JadeEngine
 **/
Mincer.JadeEngine         = require('./mincer/engines/jade_engine');


/**
 *  Mincer.JstEngine -> JstEngine
 **/
Mincer.JstEngine          = require('./mincer/engines/jst_engine');


/**
 *  Mincer.LessEngine -> LessEngine
 **/
Mincer.LessEngine         = require('./mincer/engines/less_engine');


/**
 *  Mincer.StylusEngine -> StylusEngine
 **/
Mincer.StylusEngine       = require('./mincer/engines/stylus_engine');


/**
 *  Mincer.SassEngine -> SassEngine
 **/
Mincer.SassEngine         = require('./mincer/engines/sass_engine');


/**
 *  Mincer.CoffeeEngine -> CoffeeEngine
 **/
Mincer.CoffeeEngine       = require('./mincer/engines/coffee_engine');


// Processors //////////////////////////////////////////////////////////////////


/**
 *  Mincer.DirectiveProcessor -> DirectiveProcessor
 **/
Mincer.DirectiveProcessor = require('./mincer/processors/directive_processor');


/**
 *  Mincer.CharsetNormalizer -> CharsetNormalizer
 **/
Mincer.CharsetNormalizer  = require('./mincer/processors/charset_normalizer');


/**
 *  Mincer.SafetyColons -> SafetyColons
 **/
Mincer.SafetyColons       = require('./mincer/processors/safety_colons');


/**
 *  Mincer.Autoprefixer -> Autoprefixer
 **/
Mincer.Autoprefixer       = require('./mincer/processors/autoprefixer');


/**
 *  Mincer.MacroProcessor -> MacroProcessor
 **/
Mincer.MacroProcessor = require('./mincer/processors/macro_processor');



// Compressors /////////////////////////////////////////////////////////////////


/**
 *  Mincer.CssoCompressor -> CssoCompressor
 **/
Mincer.CssoCompressor     = require('./mincer/compressors/csso_compressor');


/**
 *  Mincer.CsswringCompressor -> CsswringCompressor
 **/
Mincer.CsswringCompressor  = require('./mincer/compressors/csswring_compressor');


/**
 *  Mincer.UglifyCompressor -> UglifyCompressor
 **/
Mincer.UglifyCompressor   = require('./mincer/compressors/uglify_compressor');


// Main exported classes ///////////////////////////////////////////////////////


/**
 *  Mincer.Environment -> Environment
 **/
Mincer.Environment        = require('./mincer/environment');


/**
 *  Mincer.Manifest -> Manifest
 **/
Mincer.Manifest           = require('./mincer/manifest');


/**
 *  Mincer.Template -> Template
 **/
Mincer.Template           = require('./mincer/template');


/**
 *  Mincer.Server -> Server
 **/
Mincer.Server             = require('./mincer/server');


/**
 *  Mincer.FileStore -> FileStore
 **/
Mincer.FileStore          = require('./mincer/file_store');


// Main exported functions /////////////////////////////////////////////////////


/** alias of: Server.createServer
 *  Mincer.createServer(environment[, manifest]) -> Function
 **/
Mincer.createServer       = Mincer.Server.createServer;


// Main exported properties ////////////////////////////////////////////////////


/** read-only
 *  Mincer.VERSION -> String
 **/
prop(Mincer, 'VERSION', require('./mincer/version'));


/** read-only
 *  Mincer.logger -> Logger
 **/
prop(Mincer, 'logger',  require('./mincer/logger'));


// Spicy Sauce :)) /////////////////////////////////////////////////////////////


// main internal properties.
// each new environment clone these properties for initial states,
// so they can be used to set 'defaults' for all environment instances.
prop(Mincer, '__trail__',             new Trail(__dirname));
prop(Mincer, '__engines__',           {});
prop(Mincer, '__mimeTypes__',         new Mimoza());
prop(Mincer, '__preProcessors__',     new Hash(function () { return []; }));
prop(Mincer, '__postProcessors__',    new Hash(function () { return []; }));
prop(Mincer, '__bundleProcessors__',  new Hash(function () { return []; }));
prop(Mincer, '__compressors__',       new Hash(function () { return {}; }));
prop(Mincer, '__configurations__',    {});


// mixin helpers
mixin(Mincer, require('./mincer/helpers/engines'));
mixin(Mincer, require('./mincer/helpers/mime'));
mixin(Mincer, require('./mincer/helpers/processing'));
mixin(Mincer, require('./mincer/helpers/compressing'));
mixin(Mincer, require('./mincer/helpers/configuring'));
mixin(Mincer, require('./mincer/helpers/paths'));


// register basic mimetypes
Mincer.registerMimeType('text/css',               '.css');
Mincer.registerMimeType('application/javascript', '.js');


// register default pre-processors
Mincer.registerPreProcessor('text/css',                 Mincer.DirectiveProcessor);
Mincer.registerPreProcessor('application/javascript',   Mincer.DirectiveProcessor);

Mincer.registerPreProcessor('text/css',                 Mincer.MacroProcessor);
Mincer.registerPreProcessor('application/javascript',   Mincer.MacroProcessor);


// register default post-processors
Mincer.registerPostProcessor('application/javascript',  Mincer.SafetyColons);


// register default bundle-processors
Mincer.registerBundleProcessor('text/css',              Mincer.CharsetNormalizer);


// register predifined js compressors
Mincer.registerCompressor('application/javascript', 'uglify',   Mincer.UglifyCompressor);


// register predifined css compressors
Mincer.registerCompressor('text/css',               'csso',     Mincer.CssoCompressor);
Mincer.registerCompressor('text/css',               'csswring', Mincer.CsswringCompressor);


// Register JS engines
Mincer.registerEngine('.coffee',    Mincer.CoffeeEngine);
Mincer.registerEngine('.litcoffee', Mincer.CoffeeEngine);


// Register CSS engines
Mincer.registerEngine('.less',      Mincer.LessEngine);
Mincer.registerEngine('.styl',      Mincer.StylusEngine);
Mincer.registerEngine('.sass',      Mincer.SassEngine);
Mincer.registerEngine('.scss',      Mincer.SassEngine);


// JST engines
Mincer.registerEngine('.jst',       Mincer.JstEngine);


// Mixed type (JST / processor) engines
Mincer.registerEngine('.ejs',       Mincer.EjsEngine);
Mincer.registerEngine('.hbs',       Mincer.HandlebarsEngine);
Mincer.registerEngine('.jade',      Mincer.JadeEngine);


// Configurations //////////////////////////////////////////////////////////////


Mincer.registerConfiguration('autoprefixer', {
  enable: function (self) {
    self.registerPostProcessor('text/css', Mincer.Autoprefixer);
  },
  disable: function (self) {
    self.unregisterPostProcessor('text/css', Mincer.Autoprefixer);
  }
});


Mincer.registerConfiguration('source_maps', {state: 'disabled'});


// Alias for `source_maps`
Mincer.registerConfiguration('source_map', {
  state:    'disabled',
  enable:   function (self) { self.enable('source_maps'); },
  disable:  function (self) { self.disable('source_maps'); }
});
