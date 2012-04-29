/**
 *  Mincer
 *  includes Engines, Mime, Processing, Paths
 **/


'use strict';


// 3rd-party
var mime  = require('mime');
var Trail = require('hike').Trail;
var Hash  = require('types').Hash;


// internal
var mixin = require('./mincer/common').mixin;
var prop  = require('./mincer/common').prop;


module.exports = {
  VERSION:        '0.0.0',

  EngineTemplate: require('./mincer/engine_template'),
  Environment:    require('./mincer/environment'),
  Index:          require('./mincer/index'),
  Manifest:       require('./mincer/manifest')
};


var mime_types_options = {
  loadBuiltins: false,
  defaultType:  mime.default_type,
  normalize:    require('./common').normalizeExtension
};


prop(module.exports, '__trail__',             new Trail(__dirname));
prop(module.exports, '__engines__',           {});
prop(module.exports, '__mimeTypes__',         new (mime.Mime)(mime_types_options));
prop(module.exports, '__preprocessors__',     new Hash(function (h, k) { return h.set(k, []); }));
prop(module.exports, '__postprocessors__',    new Hash(function (h, k) { return h.set(k, []); }));
prop(module.exports, '__bundle_processors__', new Hash(function (h, k) { return h.set(k, []); }));


mixin(module.exports, require('./mincer/engines'));
mixin(module.exports, require('./mincer/mime'));
mixin(module.exports, require('./mincer/processing'));
mixin(module.exports, require('./mincer/paths'));


module.exports.registerMimeType('text/css', '.css');
module.exports.registerMimeType('application/javascript', '.js');

var DirectiveProcessor = require('./mincer/processors/directive_processor');
module.exports.registerPreprocessor('text/css', DirectiveProcessor);
module.exports.registerPreprocessor('application/javascript', DirectiveProcessor);

var SafetyColons = require('./mincer/processors/safety_colons');
module.exports.registerPostprocessor('application/javascript', SafetyColons);

var CharsetNormalizer = require('./mincer/processors/charset_normalizer');
module.exports.registerBundleProcessor('text/css', CharsetNormalizer);


// Cherry pick the default Tilt engines that make sense for Mincer.
// We don't need ones that only generate html like Jade.

// CSS
module.exports.registerEngine('.less',  require('./mincer/engines/less'));
module.exports.registerEngine('.styl',  require('./mincer/engines/stylus'));

// Other
module.exports.registerEngine('.ejs',   require('./mincer/engines/ejs'));
