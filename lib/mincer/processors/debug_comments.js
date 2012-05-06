/**
 *  class DebugComments
 *
 *  `DebugComments` inserts some information about bundled file and it's
 *  dependencies before as comments in the top of it. It is disabled by default
 *  but you can enable it with:
 *
 *      environment.registerPostProcessor('application/javascript', DebugComments);
 *      environment.registerPostProcessor('text/css',               DebugComments);
 **/


'use strict';


// 3rd-party
var _ = require('underscore');


// internal
var Template = require('../template');


var DebugComments = module.exports = function DebugComments() {
  Template.apply(this, arguments);
};


require('util').inherits(DebugComments, Template);


DebugComments.prototype.prepare = function () {};


DebugComments.prototype.evaluate = function (context, locals, fn) {
  var comments, root, pathname = this.pathname;

  root      = context.environment.root + '/';
  comments  = ' * file:          ' + context.pathname + '\n *\n' +
              ' * logicalPath:   ' + context.logicalPath + '\n' +
              ' * rootPath:      ' + context.rootPath + '\n';

  if (context.__dependencyAssets__ && 0 < context.__dependencyAssets__.length) {
    comments += ' *\n * dependencies:\n';
    _.each(context.__dependencyAssets__, function (p) {
      if (p !== pathname) {
        comments += ' *   - ' + p.replace(root, '') + '\n';
      }
    });
  }

  comments  = '/** mincer debug ***\n' +
              comments +
              ' *******************/\n';
  this.data = comments + this.data;

  fn(null, this.data);
};
