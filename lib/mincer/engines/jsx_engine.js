/**
 *  class JsxEngine
 *
 *  Engine for the React JSX transformer. You will need `react-tools` Node
 *  module installed in order to use [[Mincer]] with `*.jsx` files:
 *
 *      npm install react-tools
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


var jsx; // initialized later


// internal
var Template  = require('../template');
var prop      = require('../common').prop;


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var JsxEngine = module.exports = function JsxEngine() {
  Template.apply(this, arguments);
  jsx = jsx || Template.libs.jsx || require('react-tools');
};


require('util').inherits(JsxEngine, Template);


// Render data
JsxEngine.prototype.evaluate = function (/*context, locals*/) {
  return jsx.transform(this.data);
};


// Expose default MimeType of an engine
prop(JsxEngine, 'defaultMimeType', 'application/javascript');
