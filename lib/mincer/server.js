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
var zlib = require('zlib');
var url  = require('url');


// 3rd-party
var async = require('async');


// internal
var logger      = require('./logger');
var getter      = require('./common').getter;
var prop        = require('./common').prop;
var start_timer = require('./common').timer;


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


// Returns true whenever If-None-Match header matches etag of `asset`
function is_etag_match(req, asset) {
  return etag(asset) === (req.headers || {})['if-none-match'];
}


// Returns true whenever If-Modified-Since header matches mtime of `asset`
function is_not_modified(req, asset) {
  var mtime = Date.parse((req.headers || {})['if-modified-since']);

  // can't parse header's value
  if (isNaN(mtime)) {
    return false;
  }

  // if-modified-since >= asset's modification time
  return asset.mtime.getTime() <= mtime;
}


// Returns whenever an asset can be gzipped or not
var COMPRESSABLE_MIME_RE = new RegExp([
  '^text/',
  '/json$',
  '/javascript$',
  '/svg+xml$',
  '/x-font-ttf$',
  '/x-font-otf$'
].join('|'));
function is_compressable(asset) {
  return COMPRESSABLE_MIME_RE.test(asset.contentType);
}


// Tells whenever browser accepts gzip at all
function is_gzip_accepted(req) {
  var accept = req.headers['accept-encoding'] || '';
  return '*' === accept || 0 <= accept.indexOf('gzip');
}


// Tells whenever browser accepts gzip at all
function is_deflate_accepted(req) {
  var accept = req.headers['accept-encoding'] || '';
  return 0 <= accept.indexOf('deflate');
}


// small helper to set cmpressed buffer cache on asset.
// compressor is executed ONLY if asset has no cached property yet.
function set_compressed_cache(compressor, asset, name, callback) {
  if (undefined !== asset[name]) {
    callback();
    return;
  }

  compressor(asset.buffer, function (err, buffer) {
    if (!err) {
      // asign property only on success
      prop(asset, name, buffer);
    }
    callback(err);
  });
}


/**
 *  Server#compile(pathname, callback(err, asset)) -> Void
 *  - pathname (String)
 *  - callback (Function)
 *
 *  Finds and compiles given asset.
 **/
Server.prototype.compile = function (pathname, callback) {
  var asset = (this.manifest && !this.manifest.assets[pathname]) ? null
            : this.environment.findAsset(pathname, {bundle: true});

  if (!asset) {
    callback(/* err = undefined, asset = undefined */);
    return;
  }

  asset.compile(function (err/*, asset */) {
    if (err) {
      callback(err/*, asset = undefined */);
      return;
    }

    // got static asset without cached buffer - cache it
    if ('static' === asset.type && undefined === asset.__buffer__) {
      prop(asset, '__buffer__', asset.buffer);
    }

    // Cache gzipped buffer if asset is gzipable
    if (is_compressable(asset) && (undefined === asset.gzipped || undefined === asset.deflated)) {
      async.series([
        async.apply(set_compressed_cache, zlib.gzip, asset, 'gzipped'),
        async.apply(set_compressed_cache, zlib.deflate, asset, 'deflated')
      ], function (err) {
        callback(err, asset);
      });
      return;
    }

    // pass back to servant
    callback(err, asset);
  });
};


/**
 *  Server#handle(req, res) -> Void
 *  - req (http.ServerRequest)
 *  - res (hhtp.ServerResponse)
 *
 *  Hander function suitable for usage as server `request` event listenet or as
 *  middleware for TJ's `connect` module.
 **/
Server.prototype.handle = function (req, res) {
  var timer       = start_timer(),
      pathname    = url.parse(req.url).pathname,
      msg_prefix  = 'Served asset ' + req.url + ' - ',
      fingerprint = get_fingerprint(pathname);

  try {
    pathname = decodeURIComponent(pathname.replace(/^\//, ''));
  } catch (err) {
    logger.error(msg_prefix + 'Failed decode URL');
    end(res, 400);
    return;
  }

  // forbid requests with `..` or NUL chars
  if (0 <= pathname.indexOf('..') || 0 <= pathname.indexOf("\u0000")) {
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

  // try to find and compile asset
  this.compile(pathname, function (err, asset) {
    var buffer, length;

    if (err) {
      logger.error(msg_prefix + "Error compiling asset " + pathname);
      logger.error(msg_prefix + (err.message || err.toString()));
      logger.info(msg_prefix + "500 Application Error" + timer.stop());
      end(res, 500);
      return;
    }

    // asset not found
    if (!asset) {
      logger.info(msg_prefix + "404 Not found" + timer.stop());
      end(res, 404);
      return;
    }

    // Not modified
    if (is_etag_match(req, asset) || is_not_modified(req, asset)) {
      logger.info(msg_prefix + "304 Not Modified" + timer.stop());
      end(res, 304);
      return;
    }

    // OK
    logger.info(msg_prefix + "200 OK" + timer.stop());

    //
    // Ranges are not supported yet
    //

    res.removeHeader('Accept-Ranges');

    //
    // Mark for proxies, that we can return different content (plain & gzipped),
    // depending on specified (comma-separated) headers
    //

    res.setHeader('Vary', 'Accept-Encoding');

    //
    // Alter some headers for gzipped assets
    //

    if (asset.deflated && is_deflate_accepted(req)) {
      buffer = asset.deflated;
      length = asset.deflated.length;
      res.setHeader('Content-Encoding', 'deflate');
    }

    // gzip takes precedence if available

    if (asset.gzipped && is_gzip_accepted(req)) {
      buffer = asset.gzipped;
      length = asset.gzipped.length;
      res.setHeader('Content-Encoding', 'gzip');
    }

    //
    // Set content type and length headers
    //

    res.setHeader('Content-Type',   asset.contentType);
    res.setHeader('Content-Length', length || asset.length);

    //
    // Set caching headers
    //

    if (fingerprint) {
      // If the request url contains a fingerprint, set a long
      // expires on the response
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else {
      // Otherwise set `must-revalidate` since the asset could be modified.
      res.setHeader('Cache-Control', 'public, must-revalidate');
    }

    res.setHeader('Date',           (new Date()).toUTCString());
    res.setHeader('Last-Modified',  asset.mtime.toUTCString());
    res.setHeader('ETag',           etag(asset));

    res.statusCode = 200;

    if ('HEAD' === req.method) {
      res.end();
      return;
    }

    res.end(buffer || asset.buffer);
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
