/**
 *  class HandlebarsEngine
 *
 *  Engine for the Handlebars template language. You will need `handlebars` Node
 *  module installed in order to use [[Mincer]] with `*.hbs` files:
 *
 *     npm install handlebars
 *
 *  This is a mixed-type engine that can be used as a 'backend' of [[JstEngine]]
 *  as well as standalone 'middleware' processor in a pipeline.
 *
 *  **NOTICE** Generated functions require you to have `handlebars` client
 *  runtime to be required:
 *
 *  ``` javascript
 *  //= require handlebars.runtime
 *  //= require templates/hello
 *  ```
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var _ = require('lodash');
var Handlebars; // initialized later


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var HandlebarsEngine = module.exports = function HandlebarsEngine() {
  Template.apply(this, arguments);
  Handlebars = Handlebars || Template.libs.handlebars || require('handlebars');
};


require('util').inherits(HandlebarsEngine, Template);


// Render data
HandlebarsEngine.prototype.evaluate = function (context, locals) {
  var data = this.data;

  if (this.nextProcessor && 'JstEngine' === this.nextProcessor.name) {
    data = Handlebars.precompile(data, _.clone(locals));
    this.data = 'Handlebars.template(' + data + ')';
    return;
  }

  this.data = Handlebars.render(data, _.clone(locals));
};
