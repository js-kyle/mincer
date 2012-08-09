'use strict';


//
// Require some modules
//


var fs      = require('fs');
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
// Fix NODE_ENV environment variable
//


process.env.NODE_ENV = process.env.NODE_ENV || 'development';


//
// Attach assets server
//


if ('production' === process.env.NODE_ENV) {
  // In production we assume that assets are not changed between requests,
  // so we use cached version of environment. See API docs for details.
  environment = environment.index;
}


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


// returns a list of asset paths
function find_asset_paths(logicalPath) {
  var asset = environment.findAsset(logicalPath),
      paths = [];

  if (!asset) {
    return null;
  }

  if ('development' === process.env.NODE_ENV && asset.isCompiled) {
    asset.toArray().forEach(function (dep) {
      paths.push('/assets/' + dep.logicalPath + '?body=1');
    });
  } else {
    paths.push('/assets/' + asset.digestPath);
  }

  return paths;
}


viewHelpers.javascript = function javascript(logicalPath) {
  var paths = find_asset_paths(logicalPath);

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
  var paths = find_asset_paths(logicalPath);

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
  // make sure our assets were compiled, so their `digestPath`
  // will be 100% correct, otherwise first request will produce
  // wrong digestPath. That's not a big deal, as assets will be
  // served anyway, but to keep everything correct, we use this
  // precompilation, which is similar to using manifest, but
  // without writing files on disk.
  //
  // See [[Base#precompile]] for details,
  environment.precompile(['app.js', 'app.css'], function (err) {
    if (err) {
      next(err);
      return;
    }

    res.end(view(viewHelpers));
  });
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
