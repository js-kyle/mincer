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
 *  - [Types](http://nodeca.github.com/types/)
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
if (!require('fs').exists) {
  require('fs').exists = require('path').exists;
}
if (!require('fs').existsSync) {
  require('fs').existsSync = require('path').existsSync;
}



// 3rd-party
var Mimoza  = require('mimoza');
var Trail   = require('hike').Trail;
var Hash    = require('types').Hash;


// internal
var mixin = require('./mincer/common').mixin;
var prop  = require('./mincer/common').prop;


var Mincer = module.exports = {};


// Engines /////////////////////////////////////////////////////////////////////


/**
 *  Mincer.EjsEngine -> EjsEngine
 **/
Mincer.EjsEngine          = require('./mincer/engines/ejs_engine');


/**
 *  Mincer.HamlCoffeeEngine -> HamlCoffeeEngine
 **/
Mincer.HamlCoffeeEngine   = require('./mincer/engines/haml_coffee_engine');


/**
 *  Mincer.LessEngine -> LessEngine
 **/
Mincer.LessEngine         = require('./mincer/engines/less_engine');


/**
 *  Mincer.StylusEngine -> StylusEngine
 **/
Mincer.StylusEngine       = require('./mincer/engines/stylus_engine');


/**
 *  Mincer.CoffeeEngine -> CoffeeEngine
 **/
Mincer.CoffeeEngine       = require('./mincer/engines/coffee_engine');


// Processors //////////////////////////////////////////////////////////////////


/**
 *  Mincer.DebugComments -> DebugComments
 **/
Mincer.DebugComments      = require('./mincer/processors/debug_comments');


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
// so they can be used to set "defaults" for all environment instances.
prop(Mincer, '__trail__',             new Trail(__dirname));
prop(Mincer, '__engines__',           {});
prop(Mincer, '__mimeTypes__',         new Mimoza());
prop(Mincer, '__preProcessors__',     new Hash(function (h, k) { return h.set(k, []); }));
prop(Mincer, '__postProcessors__',    new Hash(function (h, k) { return h.set(k, []); }));
prop(Mincer, '__bundleProcessors__',  new Hash(function (h, k) { return h.set(k, []); }));


// mixin helpers
mixin(Mincer, require('./mincer/helpers/engines'));
mixin(Mincer, require('./mincer/helpers/mime'));
mixin(Mincer, require('./mincer/helpers/processing'));
mixin(Mincer, require('./mincer/helpers/paths'));


// register basic mimetypes
Mincer.registerMimeType('text/css',               '.css');
Mincer.registerMimeType('application/javascript', '.js');


// register default pre-processors
Mincer.registerPreProcessor('text/css',                 Mincer.DirectiveProcessor);
Mincer.registerPreProcessor('application/javascript',   Mincer.DirectiveProcessor);


// register default post-processors
Mincer.registerPostProcessor('application/javascript',  Mincer.SafetyColons);
Mincer.registerPostProcessor('application/javascript',  Mincer.DebugComments);
Mincer.registerPostProcessor('text/css',                Mincer.DebugComments);


// register default bundle-processors
Mincer.registerBundleProcessor('text/css',              Mincer.CharsetNormalizer);


// Register JS engines
Mincer.registerEngine('.coffee',    Mincer.CoffeeEngine);


// Register CSS engines
Mincer.registerEngine('.less',      Mincer.LessEngine);
Mincer.registerEngine('.styl',      Mincer.StylusEngine);


// Other engines
Mincer.registerEngine('.ejs',       Mincer.EjsEngine);
Mincer.registerEngine('.hamlc',     Mincer.HamlCoffeeEngine);
