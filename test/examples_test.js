/* global describe, before, after, it */
'use strict';


var spawn = require('child_process').spawn;
var path  = require('path');
var _     = require('lodash');


var request = require('supertest')('http://localhost:3000');


describe('Examples', function () {
  var srv;

  before(function (done) {
    // Turn on compression modules for CSS & JS
    var env = _.assign({}, process.env, { NODE_ENV: 'production' });

    srv = spawn(path.join(__dirname, '../examples/server.js'), [], { env: env });

    setTimeout(done, 1000);
  });


  it('Ping server demo', function (done) {
    request.get('/')
      .expect(200)
      .expect(/<!DOCTYPE html>/)
      .end(done);
  });


  after(function (done) {
    if (srv) {
      srv.kill();
    }
    setTimeout(done, 100);
  });

});
