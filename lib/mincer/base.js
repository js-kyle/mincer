/** internal
 *  class Base
 **/


// internal
var mixin = require('./common').mixin;


/**
 *  new Base()
 **/
var Base = module.exports = function Base() {};


mixin(Base.prototype, require('./paths'));
