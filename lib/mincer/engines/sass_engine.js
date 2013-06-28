/**
 *  class SassEngine
 *
 *  Engine for the SASS/SCSS compiler. You will need `node-sass` Node module installed
 *  in order to use [[Mincer]] with `*.sass` or `*.scss` files:
 *
 *      npm install node-sass
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';

// stdlib
var path = require('path');

// 3rd-party
var sass; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var SassEngine = module.exports = function SassEngine() {
  Template.apply(this, arguments);
  sass = sass || Template.libs["node-sass"] || require('node-sass');
};


require('util').inherits(SassEngine, Template);


// Render data
SassEngine.prototype.evaluate = function (context/*, locals*/) {
  var error  = null,
      result = null;

  sass.render(this.data, function(err, data){
    if(err){
      error = err;
      return;
    }
    result = data;
  }, {
    'includePaths':[path.dirname(this.file)].concat(context.environment.paths)
  });

  if(error){
    throw error;
  }

  return result;
};


// Expose default MimeType of an engine
prop(SassEngine, 'defaultMimeType', 'text/css');
