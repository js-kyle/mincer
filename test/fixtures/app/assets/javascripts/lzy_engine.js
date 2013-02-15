'use strict';

var path     = require('path'),
  Template = require(path.resolve(__dirname +
      '../../../../../../lib/mincer/template'));

var LzyEngine = module.exports = function LzyEngine() {
  Template.apply(this, arguments);
};

require('util').inherits(LzyEngine, Template);

LzyEngine.prototype.toString = function () {
  return this.lazySource.call(this.options.context, this.options.locals);
};

LzyEngine.prototype.compile = function () {
  var source = this.data;

  source = source.split("\n").map(function (l) {
    return l.trim();
  }).join('\\n').trim();

  source = source.replace(/\{\{([^\}]+)\}\}/gi, '" + this.$1 + "');
  source = source.replace(/\[\[([^\]]+)\]\]/gi, '" + locals.$1 + "');

  return new Function('locals', 'return "' + source  + '";');
};

LzyEngine.prototype.evaluate = function (context, locals, callback) {
  this.lazySource = this.compile();
  this.options = { "context": context, "locals": locals };
  callback(null, this);
};