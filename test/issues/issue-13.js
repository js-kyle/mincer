'use strict';


// stdlib
var fs = require('fs');


// mincer
var mincer  = require('../..');
var env     = new (mincer.Environment);


////////////////////////////////////////////////////////////////////////////////


function report(message, test) {
  console.log('[' + (test ? ' OK ' : 'FAIL') + '] ' + message);
}

////////////////////////////////////////////////////////////////////////////////


// append assets path
env.appendPath('assets');


// create assets dir if needed
if (!fs.existsSync('assets')) {
  fs.mkdirSync('assets');
}


// write dummy asset
fs.writeFileSync('assets/foo.js', '/*' + Date.now() + '*/\n//= require bar');
fs.writeFileSync('assets/bar.js', '/*' + Date.now() + '*/');


env.findAsset('foo').compile(function () {
  report('foo should be fresh', env.findAsset('foo').isFresh());

  setTimeout(function () {
    fs.writeFileSync('assets/bar.js', '/*' + Date.now() + '*/');
    report('foo should be stale', !env.findAsset('foo').isFresh());

    env.findAsset('foo').compile(function () {
      report('foo should be fresh', env.findAsset('foo').isFresh());

      fs.writeFileSync('assets/foo.js', '/*' + Date.now() + '*/\n//= require bar');
      report('foo should be stale', !env.findAsset('foo').isFresh());
    });
  }, 1500);
});
