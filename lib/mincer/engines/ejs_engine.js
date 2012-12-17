/**
 *  class EjsEngine
 *
 *  Engine for the EJS compiler. You will need `ejs` Node module installed
 *  in order to use [[Mincer]] with `*.ejs` files:
 *
 *      npm install ejs
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var ejs; // initialized later


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var EjsEngine = module.exports = function EjsEngine() {
  if(arguments[0].match(/jst.ejs/)){
    this.isJST = true;
  }
  Template.apply(this, arguments);
};


require('util').inherits(EjsEngine, Template);


// Check whenever ejs module is loaded
EjsEngine.prototype.isInitialized = function () {
  return !!ejs;
};


// Autoload ejs library
EjsEngine.prototype.initializeEngine = function () {
  ejs = this.require('ejs');
};


// Render data
EjsEngine.prototype.evaluate = function (context, locals, callback) {
  try {
    if(this.isJST){
      var source = ejs.parse(this.data,{compileDebug: false});
      source = "function(locals){" + source + "}";
      callback(null,source);
    }else{
      callback(null, ejs.render(this.data, {scope: context, locals: locals}));
    }
  } catch (err) {
    callback(err);
  }
};
