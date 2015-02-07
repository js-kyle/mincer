/**
 *  class Logger
 *
 *  Provides unified logging interface for Mincer.
 *
 *      Logger.use({
 *        log: function (msg) {
 *          // my logging generic logic
 *        },
 *        debug: function (msg) {
 *          // logic for debug logging
 *        }
 *      });
 **/


'use strict';


// 3rd-party
var _ = require('lodash');


// deaf logger's log function that does nothing
var noop = function () {};


// deaf logger used to provide just a "dumb" interface
var DEAF_LOGGER = {
  log:    noop,
  debug:  noop,
  info:   noop,
  warn:   noop,
  error:  noop
};


// active backend
var backend = DEAF_LOGGER;


// log level to report
var levelToReport = 0;


/**
 *  Logger.level(int) -> Logger
 *  - int (Integer): A number respresenting which levels to log
 *
 *  Allows to mute lower log levels. Any log level less than the number
 *  specified will be ignored.
 *
 *  ##### Log levels
 *
 *  - `logger.LOG_LEVEL`    : 0
 *  - `logger.DEBUG_LEVEL`  : 1
 *  - `logger.INFO_LEVEL`   : 2
 *  - `logger.WARN_LEVEL`   : 3
 *  - `logger.ERROR_LEVEL`  : 4
 *
 *  ##### Examples
 *
 *      Logger.level(Logger.WARN_LEVEL);
 *
 *      Logger.Level(4);
 **/
module.exports.level = function(ignoreBelow) {
  levelToReport = parseInt(ignoreBelow, 10) || 0;
  return this;
};


/**
 *  Logger.use(logger) -> Logger
 *  - logger (Object): An object that respond to some (or all) log levels
 *
 *  Allows to provide you own logging backend (by default all log messages are
 *  going to "nowhere").
 *
 *
 *  ##### Log levels
 *
 *  Your `logger` backend should normally respond to following methods:
 *
 *  - `logger.log(level, message)`  : Used by [[Logger.log]]
 *  - `logger.debug(message)`       : Used by [[Logger.debug]]
 *  - `logger.info(message)`        : Used by [[Logger.info]]
 *  - `logger.warn(message)`        : Used by [[Logger.warn]]
 *  - `logger.error(message)`       : Used by [[Logger.error]]
 *
 *
 *  ##### Example
 *
 *      Logger.use(console);
 **/
module.exports.use = function (logger) {
  backend = logger;
  return this;
};


/**
 *  Logger.log(level, message) -> Void
 *
 *  Generic logging method. Used as last resort if `backend` logger (provided
 *  to [[Logger.use]]) have no method for requested level.
 **/


/**
 *  Logger.debug(message) -> Void
 *
 *  Used for any non-critical information, that might be useful mostly for
 *  development only.
 **/


/**
 *  Logger.info(message) -> Void
 *
 *  Used for important messages.
 **/


/**
 *  Logger.warn(message) -> Void
 *
 *  Used for very important messages (e.g. notification about ongoing FS changes
 *  etc).
 **/


/**
 *  Logger.error(message) -> Void
 *
 *  Used for logging errors.
 **/


_.keys(DEAF_LOGGER).forEach(function (level, index) {

  // e.g. Logger.LOG_LEVEL
  module.exports[level.toUpperCase() + '_LEVEL'] = index;

  // e.g. Logger.log
  module.exports[level] = function (message) {
    // ignore if level is less then `levelToReport`
    if (index < levelToReport) {
      return;
    }

    if (_.isFunction(backend[level])) {
      backend[level](message);
      return;
    }

    // fallback to `backend.log`
    (backend.log || DEAF_LOGGER.log)(level, message);
  };
});
