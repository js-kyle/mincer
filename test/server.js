/*global describe, it*/

'use strict';

var Mincer  = require('..');
var connect = require('connect');
var request = require('supertest');

Mincer.unregisterPostProcessor('application/javascript',  Mincer.DebugComments);
var env = new (Mincer.Environment)(__dirname + '/fixtures');
env.appendPath('app/assets/javascripts');
Mincer.logger.use(console);

var app = connect();
app.use('/assets/', Mincer.createServer(env));

describe('Server', function() {

  // Source Maps
  // -----------

  it('should add `X-SourceMap` header to responses returning compiled CoffeeScript assets', function(done) {
    request(app)
    .get('/assets/server/foo.js')
    .expect('X-SourceMap', 'server/foo.js.map')
    .expect(200, 'console.log(\'foo\');\n')
    .end(function(err){
      if (err) { return done(err); }
      done();
    });
  });

  it('should serve original source when url ends with `?source=1`', function(done) {
    request(app)
    .get('/assets/server/foo.js?source=1')
    .expect(200, "console.log \'foo\'\n")
    .end(function(err){
      if (err) { return done(err); }
      done();
    });
  });

  it('should serve original source when using original source file extension', function(done) {
    request(app)
    .get('/assets/server/foo.coffee')
    .expect(200, "console.log \'foo\'\n")
    .end(function(err){
      if (err) { return done(err); }
      done();
    });
  });

  it('should serve mapping file', function(done) {
    var expectedMap = '{"version":3,"file":"foo.coffee","sources":["foo.coffee"],"names":[],"mappings":"AAAC;AAAA,OAAO,IAAP,CAAY,KAAZ"}';
    request(app)
    .get('/assets/server/foo.map')
    .expect(200, expectedMap)
    .end(function(err){
      if (err) { return done(err); }
      done();
    });
  });

  // ---

});

