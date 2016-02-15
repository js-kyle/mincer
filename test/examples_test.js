/* global describe, before, after, it */
'use strict';


var child = require('child_process');
var path  = require('path');
var _     = require('lodash');


var request = require('supertest')('http://localhost:3000');


describe('Examples', function () {
  var srv;

  before(function (done) {
    // Turn on compression modules for CSS & JS
    var env = _.assign({}, process.env, { NODE_ENV: 'production' });

    srv = child.spawn('node', [ path.join(__dirname, '../examples/server.js') ], { env: env });

    setTimeout(done, 1000);
  });


  it('Server ping', function (done) {
    request.get('/')
      .expect(200)
      .expect(/<!DOCTYPE html>/)
      .end(done);
  });


  it('Manifest run', function (done) {
    child.exec('node ' + path.join(__dirname, '../examples/manifest.js'), function (err) {
      if (err) {
        done(err);
        return;
      }

      var manifest = require(path.join(__dirname, '../examples/public/assets/manifest.json'));

      if (!manifest.assets) {
        done(new Error('No assets found in manifest: ' + manifest));
        return;
      }

      done();
    });
  });


  after(function (done) {
    if (srv) {
      srv.kill();
    }
    setTimeout(done, 100);
  });

});
