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
environment.appendPath('assets/images');
environment.appendPath('vendor/jquery');
environment.appendPath('vendor/bootstrap/js');
environment.appendPath('vendor/bootstrap/less');


//
// Define environment essential *_path helper that will be available in the
// processed assets. See `assets/stylesheets/app.css.ejs` for example.
//


environment.ContextClass.defineAssetPath(function (pathname, options) {
  var asset = this.environment.findAsset(pathname, options);

  if (!asset) {
    throw new Error("File " + pathname + " not found");
  }

  return '/assets/' + asset.digestPath;
});


//
// Prepare production-ready environment
//


if ('production' === process.env.NODE_ENV) {

  //
  // Enable JS and CSS compression
  //

  environment.jsCompressor = function (context, data, callback) {
    try {
      var ast = UglifyJS.parser.parse(data);

      ast = UglifyJS.uglify.ast_mangle(ast);
      ast = UglifyJS.uglify.ast_squeeze(ast);

      callback(null, UglifyJS.uglify.gen_code(ast));
    } catch (err) {
      callback(err);
    }
  };

  environment.cssCompressor = function (context, data, callback) {
    try {
      callback(null, Csso.justDoIt(data));
    } catch (err) {
      callback(err);
    }
  };

  //
  // In production we assume that assets are not changed between requests,
  // so we use cached version of environment. See API docs for details.
  //

  environment = environment.index;

}


//
// "Th-th-th-that's all folks!"
