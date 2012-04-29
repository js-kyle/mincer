/** internal
 *  class Base
 *  includes Paths, Mime, Processing, Engines
 **/


// internal
var mixin = require('./common').mixin;


/**
 *  new Base()
 **/
var Base = module.exports = function Base() {};


mixin(Base.prototype, require('./paths'));
mixin(Base.prototype, require('./mime'));
mixin(Base.prototype, require('./processing'));
mixin(Base.prototype, require('./engines'));
