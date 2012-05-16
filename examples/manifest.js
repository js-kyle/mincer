'use strict';


// require some modules
var fs        = require('fs');
var UglifyJS  = require('uglify-js');
var Csso      = require('csso');
var Mincer    = require('..');


// Prepare Mincer.Environment
var env = new Mincer.Environment(__dirname);


// fill in some paths
env.appendPath('assets/javascripts');
env.appendPath('assets/stylesheets');
env.appendPath('vendor/jquery');
env.appendPath('vendor/bootstrap/js');
env.appendPath('vendor/bootstrap/less');


//
// Add compressors
//

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


var manifest = new Mincer.Manifest(env, __dirname + '/public/assets');
manifest.compile(['app.js', 'app.css'], function (err, assetsData) {
  if (err) {
    console.error(err);
    return;
  }

  console.info('Assets were successfully compiled:');
  console.log(require('util').inspect(assetsData));
});
