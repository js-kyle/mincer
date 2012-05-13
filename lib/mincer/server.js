/** internal
 *  class Server
 *
 *  Easy to use server/middleware ideal for serving assets your assets:
 *
 *  - great for development, as it recompiles canged assets on-fly
 *  - great for production, as it caches results, and it can become as effecient
 *    as `staticCache` middleware (or even better) of `connect` module.
 *
 *
 *  ##### Examples
 *
 *      // development mode
 *      var srv = new Server(env);
 *
 *      // production mode
 *      var srv = new Server(env.index);
 *
 *      // production mode (restrictive)
 *      var files = ['app.js', 'app.css', 'logo.jpg'];
 *      manifest.compile(files, function (err, manifestData) {
 *        var srv = new Server(env.index, manifestData);
 *      });
 **/

'use strict';


// stdlib
var http = require('http');
var url  = require('url');


// internal
var logger = require('./logger');
var getter = require('./common').getter;
var prop   = require('./common').prop;


////////////////////////////////////////////////////////////////////////////////


/**
 *  new Server(environment[, manifest])
 *  - environment (Environment|Index)
 *  - manifest (Object): Data returned by [[Manifest#compile]]
 *
 *  If you provide `manifest`, then server will not even try to find files on
 *  FS unless they are specified in the `manifest`.
 **/
var Server = module.exports = function Server(environment, manifest) {
  prop(this, 'environment', environment);
  prop(this, 'manifest',    manifest);
};


// Retruns fingerprint from the pathname
var FINGERPRINT_RE = /-([0-9a-f]{32,40})\.[^.]+$/;
function get_fingerprint(pathname) {
  var m = FINGERPRINT_RE.exec(pathname);
  return m ? m[1] : null;
}


// Helper to write the code and end response
function end(res, code) {
  res.writeHead(code);
  res.end();
}


// Returns Etag value for `asset`
function etag(asset) {
  return '"' + asset.digest + '"';
}


// Returns true whenever Etag of `request` header matches etag of `asset`
function is_etag_match(req, asset) {
  return etag(asset) === (req.headers || {})['if-non-match'];
}


// Dummy timer
function init_timer () {
  return {
    start: Date.now(),
    stop: function () {
      return '(' + parseInt((this.start - Date.now()) / 1000, 10) + 'ms)';
    }
  };
}


/**
 *  Server#handle(req, res) -> Void
 *  - req (http.ServerRequest)
 *  - res (hhtp.ServerResponse)
 *
 *  Hander function suitable for usage as server `request` event listenet or as
 *  middleware for TJ's `connect` module.
 **/
Server.prototype.handle = function (req, res) {
  var timer       = init_timer(),
      pathname    = url.parse(req.url).pathname,
      msg_prefix  = 'Served asset ' + req.url + ' - ',
      fingerprint = get_fingerprint(pathname);

  try {
    pathname = decodeURIComponent(pathname.replace(/^\//, ''));

    // NUL char? Something really strange happens
    if (-1 < pathname.indexOf("\u0000")) {
      logger.error(msg_prefix + 'URL contains NUL char');
      end(res, 400);
      return;
    }
  } catch (err) {
    logger.error(msg_prefix + 'Failed decode URL');
    end(res, 400);
    return;
  }

  // ignore requests with `..`
  if (0 <= pathname.indexOf('..')) {
    logger.error(msg_prefix + 'URL contains unsafe chars');
    end(res, 403);
    return;
  }

  // ignore non-GET requests
  if ('GET' !== req.method && 'HEAD' !== req.method) {
    logger.error(msg_prefix + "HTTP method '" + req.method + "' not allowed");
    end(res, 403);
    return;
  }

  // remove fingerprint (digest) from URL
  if (fingerprint) {
    pathname = pathname.replace('-' + fingerprint, '');
  }

  var asset = this.environment.findAsset(pathname, {bundle: true});

  // asset not found
  if (!asset) {
    logger.info(msg_prefix + "404 Not found " + timer.stop());
    end(res, 404);
    return;
  }

  asset.compile(function (err) {
    if (err) {
      logger.error(msg_prefix + "Error compiling asset " + pathname);
      logger.error(msg_prefix + (err.message || err.toString()));
      logger.info(msg_prefix + "500 Application Error " + timer.stop());
      end(res, 500);
      return;
    }

    // Not modified
    if (is_etag_match(req, asset)) {
      logger.info(msg_prefix + "304 Not Modified " + timer.stop());
      end(res, 304);
      return;
    }

    // OK
    logger.info(msg_prefix + "200 OK " + timer.stop());

    //
    // Set content type and length headers
    //

    res.setHeader("Content-Type",   asset.contentType);
    res.setHeader("Content-Length", asset.length);

    //
    // Set caching headers
    //

    if (fingerprint) {
      // If the request url contains a fingerprint, set a long
      // expires on the response
      res.setHeader("Cache-Control", "public, max-age=31536000");
    } else {
      // Otherwise set `must-revalidate` since the asset could be modified.
      res.setHeader("Cache-Control", "public, must-revalidate");
    }

    res.setHeader("Last-Modified",  asset.mtime.toUTCString());
    res.setHeader("ETag",           etag(asset));

    res.statusCode = 200;
    res.end(asset.buffer);
  });
};


/**
 *  Server.createServer(environment[, manifest]) -> Function
 *  - environment (Environment)
 *  - manifest (Object)
 *
 *  Returns a server function suitable to be used as `request` event handler of
 *  `http` Node library module or as `connect` middleware.
 *
 *
 *  ##### Example
 *
 *      // Using TJ's Connect module
 *      var app = connect();
 *      app.use('/assets/', Server.createServer(env));
 *
 *
 *  ##### See Also
 *
 *  - [[Server.new]]
 **/
Server.createServer = function (environment, manifest) {
  var srv = new Server(environment, manifest);
  return function (req, res) {
    return srv.handle(req, res);
  };
};
