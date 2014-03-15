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
  options = _.extend({ state: 'disabled' }, options);
  this.__configurations__[name] = options;
};


// unified access to a config hash by name
function configuration(self, name) {
  if (!self.__configurations__[name]) {
    throw new Error('Unknown configuration: ' + name);
  }

  return self.__configurations__[name];
}


/**
 *  Configuring#isEnabled(name) -> Void
 *
 *  Tells whenever given configuration enabled or not.
 *
 *  ##### Example
 *
 *      if (env.isEnabled('source_maps')) {
 *        // ...
 *      }
 **/
module.exports.isEnabled = function (name) {
  return 'enabled' === configuration(this, name).state;
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
  var config = configuration(this, name);

  if (config.enable) {
    config.enable(this);
  }

  config.state = 'enabled';
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
  var config = configuration(this, name);

  if (config.disable) {
    config.disable(this);
  }

  config.state = 'disabled';
};
