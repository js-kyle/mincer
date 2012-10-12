'use strict';


// stdlib
var fs    = require('fs');
var path  = require('path');


// mincer
var mincer  = require('../..');


////////////////////////////////////////////////////////////////////////////////


function report(message, test) {
  console.log('[' + (test ? ' OK ' : 'FAIL') + '] ' + message);
}


////////////////////////////////////////////////////////////////////////////////


var env = new (mincer.Environment)(__dirname);


// append assets path
env.appendPath('issue-38');


env.findAsset('rpc').compile(function (err, asset) {
  console.log(asset.toString());
});
