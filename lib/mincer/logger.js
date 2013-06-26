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


/**
 *  Logger.use(logger) -> Void
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


_.keys(DEAF_LOGGER).forEach(function (level) {
  module.exports[level] = function (message) {
    if (backend[level]) {
      backend[level](message);
      return;
    }

    // fallback to `backend.log`
    (backend.log || DEAF_LOGGER.log)(level, message);
  };
});
