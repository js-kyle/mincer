/**
 *  class TraceurEngine
 *
 *  Engine for the TraceurScript compiler. You will need `traceur` Node
 *  module installed in order to use [[Mincer]] with `*.es6`:
 *
 *      npm install traceur
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';

// 3rd-party
var _ = require('lodash');
var path = require('path');
var traceur; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var TraceurEngine = module.exports = function TraceurEngine() {
  Template.apply(this, arguments);
  traceur = traceur || Template.libs.traceur || require('traceur');
};


require('util').inherits(TraceurEngine, Template);


// Internal (private) options storage
var options = { };

/**
 *  TraceurEngine.configure(opts) -> Void
 *  - opts (Object):
 *
 *  Allows to set TraceurScript compilation options.
 *
 *  ##### Example
 *
 *      TraceurScript.configure({ modules: 'inline' });
 **/
TraceurEngine.configure = function (opts) {
  options = _.clone(opts);
};

// Render data
TraceurEngine.prototype.evaluate = function (context/*, locals*/) {
  var compileOpts, result;

  compileOpts = _.extend({}, options, {
    filename: path.basename(context.pathname)
  });

  if (context.environment.isEnabled('source_maps')) {
    compileOpts.sourceMap = true;
    result = traceur.compile(this.data, compileOpts);
    this.data = result.js;
    this.map = result.sourceMap;
  } else {
    result = traceur.compile(this.data, compileOpts);
    this.data = result.js;
  }

  if (result.errors.length > 0) {
    throw new Error(result.errors[0]);
  }
};


// Expose default MimeType of an engine
prop(TraceurEngine, 'defaultMimeType', 'application/javascript');
