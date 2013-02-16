/**
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
 *
 *  You can use this server in your connect app (or as `request` listener of
 *  `http` server) like this:
 *
 *      app.use(function (req, res) {
 *        srv.handle(req, res);
 *      });
 *
 *      // there's a shorthand syntax as well:
 *
 *      app.use(mincer.createServer(env));
 **/

'use strict';


// stdlib
var zlib   = require('zlib');
var url    = require('url');
var format = require('util').format;


// 3rd-party
var async = require('async');


// internal
var logger      = require('./logger');
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
  return etag(asset) === req.headers['if-none-match'];
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


// Returns whenever an asset is text or not
var TEXT_MIME_RE = new RegExp([
  '^text/',
  '/json$',
  '/javascript$'
].join('|'));
function is_text(asset) {
  return TEXT_MIME_RE.test(asset.contentType);
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

  if (500 > asset.length) {
    // asset is too small - compression will not give any profit.
    // mark asset as non-compressable.
    prop(asset, name, false);
    callback();
    return;
  }

  compressor(asset.buffer, function (err, buffer) {
    if (!err && !asset[name]) {
      // assign property only on success and if it was not yet assigned.
      // the last can happen due to ocasionally occured race conditions,
      // when same file that has not gzipped buffer yet was requested twice
      // so that calling compressor was scheduled twice
      // See: https://github.com/nodeca/mincer/issues/22
      prop(asset, name, buffer);
    }
    callback(err);
  });
}


// Returns log event structure.
//
function log_event(req, code, message, elapsed) {
  return {
    code:           code,
    message:        message,
    elapsed:        elapsed,
    request:        req,
    url:            req.url,
    method:         req.method,
    headers:        req.headers,
    httpVersion:    req.httpVersion,
    remoteAddress:  req.connection.remoteAddress
  };
}


/** internal
 *  Server#log(level, event) -> Void
 *  - level (String): Event level
 *  - event (Object): Event data
 *
 *  This is an internal method that formats and writes messages using
 *  [[Mincer.logger]] and it fits almost 99% of cases. But if you want to
 *  integrate this [[Server]] into your existing application and have logs
 *  formatted in your way you can override this method.
 *
 *
 *  ##### Event
 *
 *  Event is an bject with following fields:
 *
 *  - **code** (Number): Status code
 *  - **message** (String): Message
 *  - **elapsed** (Number): Time elapsed in milliseconds
 *  - **url** (String): Request url. See `http.request.url`.
 *  - **method** (String): Request method. See `http.request.method`.
 *  - **headers** (Object): Request headers. See `http.request.headers`.
 *  - **httpVersion** (String): Request httpVersion. See `http.request.httpVersion`.
 **/
Server.prototype.log = function log(level, event) {
  logger[level](format('Served asset %s - %d %s (%dms)',
                       event.url, event.code, event.message, event.elapsed));
};


/**
 *  Server#compile(pathname, bundle, callback(err, asset)) -> Void
 *  - pathname (String)
 *  - bundle (Boolean)
 *  - callback (Function)
 *
 *  Finds and compiles given asset.
 **/
Server.prototype.compile = function compile(pathname, bundle, callback) {
  var asset = (this.manifest && !this.manifest.assets[pathname]) ? null
            : this.environment.findAsset(pathname, {bundle: !!bundle});

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
 *
 *
 *  ##### Exampple
 *
 *  var assetsSet
 **/
Server.prototype.handle = function handle(req, res) {
  var self        = this,
      timer       = start_timer(),
      pathname    = url.parse(req.url).pathname,
      bundle      = !/body=[1t]/.test(url.parse(req.url).query),
      fingerprint = get_fingerprint(pathname);

  try {
    pathname = decodeURIComponent(pathname.replace(/^\//, ''));
  } catch (err) {
    self.log('error', log_event(req, 400, 'Failed decode URL', timer.stop()));
    end(res, 400);
    return;
  }

  // forbid requests with `..` or NUL chars
  if (0 <= pathname.indexOf('..') || 0 <= pathname.indexOf("\u0000")) {
    self.log('error', log_event(req, 403, 'URL contains unsafe chars', timer.stop()));
    end(res, 403);
    return;
  }

  // ignore non-GET requests
  if ('GET' !== req.method && 'HEAD' !== req.method) {
    self.log('error', log_event(req, 403, 'HTTP method not allowed', timer.stop()));
    end(res, 403);
    return;
  }

  // remove fingerprint (digest) from URL
  if (fingerprint) {
    pathname = pathname.replace('-' + fingerprint, '');
  }

  // try to find and compile asset
  this.compile(pathname, bundle, function (err, asset) {
    var buffer, length;

    if (err) {
      err = err.message || err.toString();
      self.log('error', log_event(req, 500, 'Error compiling asset: ' + err, timer.stop()));
      end(res, 500);
      return;
    }

    // asset not found
    if (!asset) {
      self.log('error', log_event(req, 404, 'Not found', timer.stop()));
      end(res, 404);
      return;
    }

    //
    // Asset found. Sending headers for 200/304 responses:
    // http://tools.ietf.org/html/draft-ietf-httpbis-p4-conditional-18#section-4.1
    //

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
    // Set caching headers
    //

    if (fingerprint) {
      // If the request url contains a fingerprint, set a long
      // expires on the response
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    } else {
      // Otherwise set `must-revalidate` since the asset could be modified.
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    }

    res.setHeader('Date',           (new Date()).toUTCString());
    res.setHeader('Last-Modified',  asset.mtime.toUTCString());
    res.setHeader('ETag',           etag(asset));
    res.setHeader('Server',         'Nokla 1630');

    //
    // Check if asset's etag matches `if-none-match` header
    //

    if (is_etag_match(req, asset)) {
      self.log('info', log_event(req, 304, 'Not Modified', timer.stop()));
      end(res, 304);
      return;
    }

    // OK
    self.log('info', log_event(req, 200, 'OK', timer.stop()));

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
    // Force charset for text assets, to avoid problems with JS loaders
    //
    res.setHeader('Content-Type', asset.contentType + (is_text(asset) ? '; charset=UTF-8' : ''));
    res.setHeader('Content-Length', length || asset.length);

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
