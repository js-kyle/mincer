'use strict';


// stdlib
var fs    = require('fs');
var path  = require('path');


// mincer
var mincer  = require('../..');


////////////////////////////////////////////////////////////////////////////////


var ASSETS_ROOT = path.join(__dirname, 'assets');


function report(message, test) {
  console.log('[' + (test ? ' OK ' : 'FAIL') + '] ' + message);
}


function write(file, text) {
  fs.writeFileSync(path.join(ASSETS_ROOT, file), text);
}


////////////////////////////////////////////////////////////////////////////////


var env = new (mincer.Environment)(__dirname);


// append assets path
env.appendPath('assets');


// create assets dir if needed
if (!fs.existsSync(ASSETS_ROOT)) {
  fs.mkdirSync(ASSETS_ROOT);
}


// write dummy asset
write('foo.js', '/*' + Date.now() + '*/\n//= require bar');
write('bar.js', '/*' + Date.now() + '*/');


env.findAsset('foo').compile(function () {
  report('foo should be fresh', env.findAsset('foo').isFresh(env));

  setTimeout(function () {
    write('bar.js', '/*' + Date.now() + '*/');
    report('foo should be stale', !env.findAsset('foo').isFresh(env));

    env.findAsset('foo').compile(function () {
      report('foo should be fresh', env.findAsset('foo').isFresh(env));

      write('foo.js', '/*' + Date.now() + '*/\n//= require bar');
      report('foo should be stale', !env.findAsset('foo').isFresh(env));
    });
  }, 1234);
});
