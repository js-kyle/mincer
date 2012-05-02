'use strict';


var mincer = require('../index');
var env = new (mincer.Environment)(__dirname + '/fixtures');


env.appendPath('app/assets/javascripts');
env.appendPath('app/assets/stylesheets');
env.appendPath('vendor/assets/stylesheets');


var manifest = new (mincer.Manifest)(env, __dirname + '/assets');


manifest.compile(['app.css', 'app.js'], function (err, manifest) {
  console.log(err);
  console.log(manifest);
});
