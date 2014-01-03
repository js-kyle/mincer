/** internal
 *  mixin Configuring
 *
 *  An internal mixin whose public methods are exposed on the [[Environment]]
 *  and [[Index]] classes.
 **/


// REQUIRED PROPERTIES /////////////////////////////////////////////////////////
//
// - `__configurations__` (Hash)
//
////////////////////////////////////////////////////////////////////////////////


'use strict';


// 3rd-party
var _ = require('lodash');


////////////////////////////////////////////////////////////////////////////////


/**
 *  Configuring#getConfigurations() -> Object
 *
 *  Returns copy of registered configurations.
 **/
module.exports.getConfigurations = function () {
  return _.cloneDeep(this.__configurations__);
};



/**
 *  Configuring#registerConfiguration(name, options) -> Void
 *
 *  ##### Example
 *
 *      Mincer.registerConfiguration('autoprefixer', {
 *        enable: function (self) {
 *          self.registerPostProcessor('text/css', Mincer.Autoprefixer);
 *        },
 *        disable: function (self) {
 *          self.unregisterPostProcessor('text/css', Mincer.Autoprefixer);
 *        }
 *      });
 **/
module.exports.registerConfiguration = function (name, options) {
  if (!options || !options.enable || !options.disable) {
    throw new Error('Invalid configurator');
  }

  this.__configurations__[name] = options;
};


/**
 *  Configuring#enable(name) -> Void
 *
 *  Enable configuration.
 *
 *  ##### Example
 *
 *      env.enable('autoprefixer');
 **/
module.exports.enable = function (name) {
  if (!this.__configurations__[name]) {
    throw new Error('Unknown configuration: ' + String(name));
  }

  this.__configurations__[name].enable(this);
};


/**
 *  Configuring#disable(name) -> Void
 *
 *  Disable configuration.
 *
 *  ##### Example
 *
 *      env.disable('autoprefixer');
 **/
module.exports.disable = function (name) {
  if (!this.__configurations__[name]) {
    throw new Error('Unknown configuration: ' + String(name));
  }

  this.__configurations__[name].disable(this);
};
