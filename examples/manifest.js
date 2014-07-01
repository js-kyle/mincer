#!/usr/bin/env node
'use strict';


//
// Require some modules
//


var Mincer = require('..');


//
// Get Mincer environment
//


var environment = require('./environment');


//
// Create and compile Manifest
//


var manifest = new Mincer.Manifest(environment, __dirname + '/public/assets');


try {
  var assetsData = manifest.compile(['app.js', 'app.css', 'stripes.png'], {
                                        compress: true,
                                        sourceMaps: true,
                                        embedMappingComments: true
                                      });

  console.info('\n\nAssets were successfully compiled.\n' +
               'Manifest data (a proper JSON) was written to:\n' +
               manifest.path + '\n\n');
  console.dir(assetsData);
} catch (err) {
  console.error("Failed compile assets: " + (err.message || err.toString()));
}
