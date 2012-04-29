/** internal
 *  class Index
 *
 *  Subclass of [[Base]]
 *
 *  `Index` is a special cached version of [[Environment]].
 *
 *  The expection is that all of its file system methods are cached
 *  for the instances lifetime. This makes `Index` much faster. This
 *  behavior is ideal in production environments where the file system
 *  is immutable.
 *
 *  `Index` should not be initialized directly. Instead use
 *  [[Environment#index]].
 **/


'use strict';


// 3rd-party
var Trail = require('hike').Trail;


// internal
var Base = require('./base');
var prop = require('./common').prop;


/**
 *  new Index(environment)
 **/
var Index = module.exports = function Index(environment) {
  prop(this, '__environment__', environment);

  Base.call(this);
};


require('util').inherits(Index, Base);
