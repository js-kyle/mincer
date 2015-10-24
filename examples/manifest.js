#!/usr/bin/env node
'use strict';


//
// Require some modules
//


var Mincer = require('..');
var path   = require('path');


//
// Get Mincer environment
//


var environment = require('./environment');


//
// Create and compile Manifest
//


var manifest = new Mincer.Manifest(environment, path.join(__dirname, 'public', 'assets'));


try {
  var assetsData = manifest.compile([ 'app.js', 'app.css', 'alt.css', 'stripes.png' ], {
    compress: true,
    sourceMaps: true,
    embedMappingComments: true
  });

  /*eslint-disable no-console*/
  console.info('\n\nAssets were successfully compiled.\n' +
               'Manifest data (a proper JSON) was written to:\n' +
               manifest.path + '\n\n');
  console.dir(assetsData);
} catch (err) {
  console.error('Failed compile assets: ' + (err.message || err.toString()));
  process.exit(1);
}
