'use strict';


// stdlib
var http = require('http');
var zlib = require('zlib');
var url  = require('url');


// internal
var logger = require('./logger');
var getter = require('./common').getter;
var prop   = require('./common').prop;


var Server = function Server(environment, options) {
  prop(this, 'environment', environment);
};


// compresses buffer and fires `callback(err, str)`
function gzip_buffer(buff, callback) {
  zlib.createGzip().gzip(buff, callback);
}


var FINGERPRINT_RE = /-([0-9a-f]{32,40})\.[^.]+$/;
function get_fingerprint(pathname) {
  var m = FINGERPRINT_RE.exec(pathname);
  return m ? m[1] : null;
}


function end(res, code) {
  res.writeHead(code);
  res.end();
}


var BODY_ONLY_RE = /body=[1t]/;
function is_body_only(req) {
  var query = req.query || url.parse(req.url).query;
  BODY_ONLY_RE.test(query);
}


function etag(asset) {
  return '"' + asset.digest + '"';
}

function is_etag_match(req, asset) {
  return etag(asset) === (req.headers || {})['if-non-match'];
}


// Dummy Timer
function Timer () {
  this.__start__ = Date.now();

  this.stop = function () {
    return '(' + parseInt((this.__start__ - Date.now()) / 1000, 10) + 'ms)';
  };
}


Server.prototype.onRequest = function (req, res) {
  var self        = this,
      timer       = new Timer(),
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

  var asset = this.environment.findAsset(pathname, {bundle: !is_body_only(req)});

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

    res.setHeader("Last-Modified",  asset.mtime.httpdate);
    res.setHeader("ETag",           etag(asset));

    res.statusCode = 200;
    res.end(asset.buffer);
  });
};


module.exports = function (env, options) {
  var srv = new Server(env, options);
  return function (req, res) {
    return srv.onRequest(req, res);
  };
};
