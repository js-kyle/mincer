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


// returns a list of asset paths
function find_asset_paths(logicalPath, ext) {
  var asset = environment.findAsset(logicalPath),
      paths = [];

  if (!asset) {
    return null;
  }

  if ('production' !== process.env.NODE_ENV) {
    asset.toArray().forEach(function (dep) {
      paths.push('/assets/' + rewrite_extension(dep.logicalPath, ext) + '?body=1');
    });
  } else {
    paths.push('/assets/' + rewrite_extension(asset.digestPath, ext));
  }

  return paths;
}


viewHelpers.javascript = function javascript(logicalPath) {
  var paths = find_asset_paths(logicalPath, '.js');

  if (!paths) {
    // this will help us notify that given logicalPath is not found
    // without "breaking" view renderer
    return '<script type="application/javascript">alert("Javascript file ' +
           JSON.stringify(logicalPath).replace(/"/g, '\\"') +
           ' not found.")</script>';
  }

  return paths.map(function (path) {
    return '<script type="application/javascript" src="' + path + '"></script>';
  }).join('\n');
};


viewHelpers.stylesheet = function stylesheet(logicalPath) {
  var paths = find_asset_paths(logicalPath, '.css');

  if (!paths) {
    // this will help us notify that given logicalPath is not found
    // without "breaking" view renderer
    return '<script type="application/javascript">alert("Stylesheet file ' +
           JSON.stringify(logicalPath).replace(/"/g, '\\"') +
           ' not found.")</script>';
  }

  return paths.map(function (path) {
    return '<link rel="stylesheet" type="text/css" href="' + path + '" />';
  }).join('\n');
};



//
// Attach some dummy handler, that simply renders layout
//


app.use(function (req, res, next) {
  var data;

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
