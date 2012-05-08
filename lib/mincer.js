/**
 *  Mincer
 *  includes Engines, Mime, Processing, Paths
 **/


'use strict';


// 3rd-party
var Mimoza  = require('mimoza');
var Trail   = require('hike').Trail;
var Hash    = require('types').Hash;


// internal
var mixin = require('./mincer/common').mixin;
var prop  = require('./mincer/common').prop;


var Mincer = module.exports = {};


// Engines
Mincer.EjsEngine          = require('./mincer/engines/ejs_engine');
Mincer.LessEngine         = require('./mincer/engines/less_engine');
Mincer.StylusEngine       = require('./mincer/engines/stylus_engine');
Mincer.CoffeeEngine       = require('./mincer/engines/coffee_engine');

// Processors
Mincer.DebugComments      = require('./mincer/processors/debug_comments');
Mincer.DirectiveProcessor = require('./mincer/processors/directive_processor');
Mincer.CharsetNormalizer  = require('./mincer/processors/charset_normalizer');
Mincer.SafetyColons       = require('./mincer/processors/safety_colons');

// Main exported classes
Mincer.Environment        = require('./mincer/environment');
Mincer.Manifest           = require('./mincer/manifest');


// read-only VERSION property
prop(Mincer, 'VERSION', require('./mincer/version'));
prop(Mincer, 'logger',  require('./mincer/logger'));


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
