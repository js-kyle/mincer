'use strict';


// 3rd-party
var _ = require('underscore');


// deaf logger's log function that does nothing
var noop = function () {};


// deaf logger used to provide just a "dumb" interface
var DEAF_LOGGER = {
  log:    noop,
  debug:  noop,
  notice: noop,
  info:   noop,
  warn:   noop,
  error:  noop
};


// active backend
var backend = DEAF_LOGGER;


module.exports.use = function (logger) {
  backend = logger;
};


_.keys(DEAF_LOGGER).forEach(function (level) {
  module.exports[level] = function () {
    (backend[level] || backend.log || DEAF_LOGGER[level]).apply(null, arguments);
  };
});
