/**
 *  class Autoprefixer
 *
 *  Post processor that runs autoprefixer for css. You will need `autoprefixer`
 *  and `postcss` Node modules installed:
 *
 *      npm install autoprefixer
 *      npm install postcss
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var _    = require('lodash');
var path = require('path');
var autoprefixer, postcss; // initialized later


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var Autoprefixer = module.exports = function Autoprefixer() {
  Template.apply(this, arguments);
  autoprefixer = autoprefixer || Template.libs.autoprefixer || require('autoprefixer-core');
  try {
    postcss = postcss || Template.libs.postcss || require('postcss');
  } catch(e) {
    // Fail silently for now
    // A warning will appear every time when ap.process() is called.
  }
};


require('util').inherits(Autoprefixer, Template);


// Internal (private) requirements storage
var requirements;


/**
 *  Autoprefixer.configure(reqs) -> Void
 *  - reqs (Array|String):
 *
 *  Allows to set Autoprefixer requirements.
 *
 *  Default: `undefined`.
 *
 *
 *  ##### Example
 *
 *      Autoprefixer.configure(['> 1%', 'ie 8']);
 **/
Autoprefixer.configure = function (reqs) {
  requirements = _.clone(reqs);
};


// Prefix data
Autoprefixer.prototype.evaluate = function (context/*, locals*/) {
  var ap = autoprefixer({ browsers: requirements }), result;

  if (!ap.process) {
    // Old API, autoprefixer < v1.0
    this.data = ap.compile(this.data);
    return;
  }

  if (postcss && postcss.plugin) {
    // Newer API for autoprefixer-core >= 5.2
    ap = postcss([ ap ]);
  }

  if (!context.environment.isEnabled('source_maps')) {
    this.data = ap.process(this.data).css;
    return;
  }

  // Reset sourceRoot bebore process - we work with relative paths
  var map = context.createSourceMapObject(this);

  result = ap.process(this.data, {
    map:            {
      prev: map,
      inline: false
    },
    from:           path.basename(context.pathname),
    to:             path.basename(context.pathname)
  });

  this.map  = result.map;
  this.data = result.css;
};
