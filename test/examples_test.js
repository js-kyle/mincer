/* global describe, before, after, it */
'use strict';


var spawn = require('child_process').spawn;
var path  = require('path');


var request = require('supertest')('http://localhost:3000');


describe('Examples', function () {
  var srv;

  before(function (done) {
    srv = spawn(path.join(__dirname, '../examples/server.js'));
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
