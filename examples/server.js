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

    res.end(view({
      // dummy `asset_path` helper
      asset_path: function (pathname) {
        return '/assets/' + environment.findAsset(pathname).digestPath;
      }
    }));
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
