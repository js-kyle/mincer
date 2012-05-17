'use strict';


//
// Require some modules
//


var UglifyJS  = require('uglify-js');
var Csso      = require('csso');
var Mincer    = require('..');


//
// Configure Mincers logger, by default, all
// messages are going to the middle of nowhere
//


Mincer.logger.use(console);


//
// Create and export environment
//


var environment = module.exports = new Mincer.Environment(__dirname);


//
// Configure environment load paths (where to find ssets)
//


environment.appendPath('assets/javascripts');
environment.appendPath('assets/stylesheets');
environment.appendPath('vendor/jquery');
environment.appendPath('vendor/bootstrap/js');
environment.appendPath('vendor/bootstrap/less');


//
// Set JS and CSS compressors (for production)
//


if ('production' === process.env.NODE_ENV) {
  environment.jsCompressor = function (data, callback) {
    try {
      var ast = UglifyJS.parser.parse(data);

      ast = UglifyJS.uglify.ast_mangle(ast);
      ast = UglifyJS.uglify.ast_squeeze(ast);

      callback(null, UglifyJS.uglify.gen_code(ast));
    } catch (err) {
      callback(err);
    }
  };

  environment.cssCompressor = function (data, callback) {
    try {
      callback(null, Csso.justDoIt(data));
    } catch (err) {
      callback(err);
    }
  };
}


//
// "Th-th-th-that's all folks!"
