'use strict';


// internal
var mixin = require('./mincer/common');


module.exports = {
  VERSION:        '0.0.0',

  EngineTemplate: require('./mincer/engine_template'),
  Environment:    require('./mincer/environment'),
  Manifest:       require('./mincer/manifest')
};


mixin(module.exports, require('./mincer/engines'));
mixin(module.exports, require('./mincer/paths'));
