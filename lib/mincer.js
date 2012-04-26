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


mixin(module.exports, require('./mincer/engines'));
mixin(module.exports, require('./mincer/paths'));
