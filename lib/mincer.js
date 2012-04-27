'use strict';


// internal
var mixin = require('./mincer/common').mixin;
var prop  = require('./mincer/common').prop;


module.exports = {
  VERSION:        '0.0.0',

  EngineTemplate: require('./mincer/engine_template'),
  Environment:    require('./mincer/environment'),
  Manifest:       require('./mincer/manifest')
};


prop(module.exports, '__engines__', {});

prop(module.exports, '__preprocessors__',     {});
prop(module.exports, '__postprocessors__',    {});
prop(module.exports, '__bundle_processors__', {});


mixin(module.exports, require('./mincer/engines'));
mixin(module.exports, require('./mincer/processing'));
mixin(module.exports, require('./mincer/paths'));
