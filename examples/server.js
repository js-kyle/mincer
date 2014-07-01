#!/usr/bin/env node
'use strict';


//
// Require some modules
//


var fs      = require('fs');
var path    = require('path');
var jade    = require('jade');
var connect = require('connect');
var Mincer  = require('..');


//
// Get Mincer environment
//


var environment = require('./environment');


//
// Create connect application
//


var app = connect();


//
// Attach assets server
//


app.use('/assets/', Mincer.createServer(environment));


//
// Prepare HTML layout for our dummy application
// See `views/layout.jade` for example of `javascript` and `stylesheet` usage.
//


var view;

try {
  view = fs.readFileSync(__dirname + '/views/layout.jade', 'utf8');
  view = jade.compile(view);
} catch (err) {
  console.error("Failed compile view: " + (err.message || err.toString()));
  process.exit(128);
}


//
// Define some view helpers
//


var viewHelpers = {};


// dummy helper that injects extension
function rewrite_extension(source, ext) {
  var source_ext = path.extname(source);
  return (source_ext === ext) ? source : (source + ext);
}


viewHelpers.javascript = function javascript(logicalPath) {
  var asset = environment.findAsset(logicalPath);

  if (!asset) {
    // this will help us notify that given logicalPath is not found
    // without "breaking" view renderer
    return '<script type="application/javascript">alert("Javascript file ' +
           JSON.stringify(logicalPath).replace(/"/g, '\\"') +
           ' not found.")</script>';
  }

  return '<script type="application/javascript" src="/assets/' +
    rewrite_extension(asset.digestPath, '.js') +
    '"></script>';
};


viewHelpers.stylesheet = function stylesheet(logicalPath) {
  var asset = environment.findAsset(logicalPath);

  if (!asset) {
    // this will help us notify that given logicalPath is not found
    // without "breaking" view renderer
    return '<script type="application/javascript">alert("Stylesheet file ' +
           JSON.stringify(logicalPath).replace(/"/g, '\\"') +
           ' not found.")</script>';
  }

  return '<link rel="stylesheet" type="text/css" href="/assets/' +
    rewrite_extension(asset.digestPath, '.css') +
    '" />';
};



//
// Attach some dummy handler, that simply renders layout
//


app.use(function (req, res, next) {
  var data;

  if ("/" != req.url) {
    res.statusCode = 404
    res.end("Not Found");
    return;
  }

  try {
    data = view(viewHelpers);
  } catch (err) {
    next(err);
    return;
  }

  res.end(data);
});


//
// Start listening
//


app.listen(3000, function (err) {
  if (err) {
    console.error("Failed start server: " + (err.message || err.toString()));
    process.exit(128);
  }

  console.info('Listening on localhost:3000');
});
