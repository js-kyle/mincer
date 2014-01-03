/**
 *  class LiveScriptEngine
 *
 *  Engine for the LiveScript compiler. You will need `LiveScript` Node
 *  module installed in order to use [[Mincer]] with `*.ls` files:
 *
 *      npm install LiveScript
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var _ = require('lodash');
var liveScript; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var LiveScriptEngine = module.exports = function LiveScriptEngine() {
  Template.apply(this, arguments);
  liveScript = liveScript || Template.libs.LiveScript || require('LiveScript');
};


require('util').inherits(LiveScriptEngine, Template);


// Internal (private) options storage
var options = {bare: true};


/**
 *  LiveScriptEngine.configure(opts) -> Void
 *  - opts (Object):
 *
 *  Allows to set LiveScript compilation options.
 *  Default: `{bare: true}`.
 *
 *  ##### Example
 *
 *      LiveScript.configure({bare: true});
 **/
LiveScriptEngine.configure = function (opts) {
  options = _.clone(opts);
};


// Render data
LiveScriptEngine.prototype.evaluate = function (/*context, locals*/) {
  var loc;

  try {
    return liveScript.compile(this.data, _.clone(options));
  } catch(err) {
    loc = err.location;

    if (loc) {
      loc = 'L' + (loc.first_line + 1) + ':' + (loc.first_column + 1);
      err.message += ' at ' + loc;
    }

    throw err;
  }
};


// Expose default MimeType of an engine
prop(LiveScriptEngine, 'defaultMimeType', 'application/javascript');
