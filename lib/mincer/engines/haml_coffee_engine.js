/**
 *  class HamlCoffeeEngine
 *
 *  Engine for the Haml Coffee Template compiler. You will need `haml-coffee`
 *  and `coffee-script` Node modules installed in order to use [[Mincer]] with
 *  `*.hamlc` files:
 *
 *     npm install coffee-script haml-coffee
 *
 *  This is a mixed-type engine that can be used as a 'backend' of [[JstEngine]]
 *  as well as standalone 'middleware' processor in a pipeline.
 *
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


// 3rd-party
var _ = require('lodash');
var CoffeeScript; // initialized later
var HamlCoffee;   // initialized later


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var HamlCoffeeEngine = module.exports = function HamlCoffeeEngine() {
  Template.apply(this, arguments);
  CoffeeScript  = CoffeeScript || Template.libs['coffee-script'] || require('coffee-script');
  HamlCoffee    = HamlCoffee || Template.libs['haml-coffee/src/haml-coffee'] || require('haml-coffee/src/haml-coffee');
};


require('util').inherits(HamlCoffeeEngine, Template);


// Internal (private) options storage
var options = {};


/**
 *  HamlCoffeeEngine.configure(opts) -> Void
 *  - opts (Object):
 *
 *  Allows to set Haml Coffee Template compilation opts.
 *  See Haml Coffee Template compilation opts for details.
 *
 *  Default: `{}`.
 *
 *
 *  ##### Example
 *
 *      HamlCoffeeEngine.configure({basename: true});
 **/
HamlCoffeeEngine.configure = function (opts) {
  options = _.clone(opts);
};


// Render data
HamlCoffeeEngine.prototype.evaluate = function (context, locals) {
  var compiler, source, evil = 'eval';

  compiler = new HamlCoffee(_.clone(options));
  compiler.parse(this.data);

  source = compiler.precompile().replace(/^(.*)$/mg, '  $1');
  source = '(context) -> ( -> \n' + source + '\n).call(context)';

  if (this.nextProcessor && 'JstEngine' === this.nextProcessor.name) {
    return CoffeeScript.compile(source, { bare: true });
  }

  return CoffeeScript[evil](source)(locals);
};
