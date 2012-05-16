'use strict';


// require some modules
var fs      = require('fs');
var connect = require('connect');
var jade    = require('jade');
var Mincer  = require('..');


// Create connect application
var app = connect();


// Prepare Mincer.Environment
var env = new Mincer.Environment(__dirname);


// fill in some paths
env.appendPath('assets/javascripts');
env.appendPath('assets/stylesheets');
env.appendPath('vendor/jquery');
env.appendPath('vendor/bootstrap/js');
env.appendPath('vendor/bootstrap/less');


if ('production' === process.env.NODE_ENV) {
  var UglifyJS    = require('uglify-js');
  var Csso        = require('csso');

  // In production we would like assets to be compressed
  env.jsCompressor = function (data, callback) {
    try {
      var ast = UglifyJS.parser.parse(data);

      ast = UglifyJS.uglify.ast_mangle(ast);
      ast = UglifyJS.uglify.ast_squeeze(ast);

      callback(null, UglifyJS.uglify.gen_code(ast));
    } catch (err) {
      callback(err);
    }
  };

  env.cssCompressor = function (data, callback) {
    try {
      callback(null, Csso.justDoIt(data));
    } catch (err) {
      callback(err);
    }
  };

  // Index is a special "static" version of Environment ideal for production
  app.use('/assets/', Mincer.createServer(env.index));
} else {
  // In development we want Mincer to rebuild assets when they are modified
  app.use('/assets/', Mincer.createServer(env));
}


// Use console for logging
Mincer.logger.use(console);


// Prepare HTML layout
var view = jade.compile(fs.readFileSync(__dirname + '/views/layout.jade', 'utf8'));


// define some dummy application
app.use(function (req, res) {
  var data = view({
    // dummy `asset_path` helper
    asset_path: function (pathname) {
      return '/assets/' + env.findAsset(pathname).logicalPath;
    }
  });

  res.end(data);
});


// start listening
app.listen(3000);
console.log('Listening on localhost:3000');
