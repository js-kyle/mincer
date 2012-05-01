/**
 *  Mincer
 *  includes Engines, Mime, Processing, Paths
 **/


'use strict';


// 3rd-party
var mimoza  = require('mimoza');
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

// Processors
Mincer.DirectiveProcessor = require('./mincer/processors/directive_processor');
Mincer.CharsetNormalizer  = require('./mincer/processors/charset_normalizer');
Mincer.SafetyColons       = require('./mincer/processors/safety_colons');

Mincer.Template           = require('./mincer/template');
Mincer.Environment        = require('./mincer/environment');
Mincer.Index              = require('./mincer/index');
Mincer.Manifest           = require('./mincer/manifest');


var mime_types_options = {
  loadBuiltins: false,
  defaultType:  mimoza.default_type,
  normalize:    require('./mincer/common').normalizeExtension
};


prop(Mincer, '__trail__',             new Trail(__dirname));
prop(Mincer, '__engines__',           {});
prop(Mincer, '__mimeTypes__',         new (mimoza.Mime)(mime_types_options));
prop(Mincer, '__preprocessors__',     new Hash(function (h, k) { return h.set(k, []); }));
prop(Mincer, '__postprocessors__',    new Hash(function (h, k) { return h.set(k, []); }));
prop(Mincer, '__bundle_processors__', new Hash(function (h, k) { return h.set(k, []); }));


mixin(Mincer, require('./mincer/helpers/engines'));
mixin(Mincer, require('./mincer/helpers/mime'));
mixin(Mincer, require('./mincer/helpers/processing'));
mixin(Mincer, require('./mincer/helpers/paths'));


Mincer.registerMimeType('text/css', '.css');
Mincer.registerMimeType('application/javascript', '.js');


Mincer.registerPreprocessor('text/css',                 Mincer.DirectiveProcessor);
Mincer.registerPreprocessor('application/javascript',   Mincer.DirectiveProcessor);

Mincer.registerPostprocessor('application/javascript',  Mincer.SafetyColons);

Mincer.registerBundleProcessor('text/css',              Mincer.CharsetNormalizer);


// Cherry pick the default Tilt engines that make sense for Mincer.
// We don't need ones that only generate html like Jade.

// CSS
Mincer.registerEngine('.less',  Mincer.LessEngine);
Mincer.registerEngine('.styl',  Mincer.StylusEngine);

// Other
Mincer.registerEngine('.ejs',   Mincer.EjsEngine);
