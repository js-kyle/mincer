/**
 *  class Environment
 *
 *  Subclass of [[Base]]
 **/


'use strict';


// 3rd-party
var Trail = require('hike').Trail;


// internal
var Base = require('./base');


/**
 *  new Environment(root)
 **/
var Environment = module.exports = function Environment(root) {
  this.trail = new Trail(root || '.');

  Base.call(this);
};


require('util').inherits(Environment, Base);
