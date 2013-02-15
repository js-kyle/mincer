'use strict';

var path     = require('path'),
  Template = require(path.resolve(__dirname +
      '../../../../../../lib/mincer/template'));

var StrEngine = module.exports = function StrEngine() {
  Template.apply(this, arguments);
};

require('util').inherits(StrEngine, Template);

StrEngine.prototype.compile = function () {
  var source = this.data;

  source = source.split("\n").map(function (l) {
    return l.trim();
  }).join('\\n').trim();

  source = source.replace(/\{\{([^\}]+)\}\}/gi, '" + this.$1 + "');
  source = source.replace(/\[\[([^\]]+)\]\]/gi, '" + locals.$1 + "');

  return 'function(locals) { return "' + source + '"; }';
};

StrEngine.prototype.evaluate = function (context, locals, callback) {
  callback(null, this.compile());
};