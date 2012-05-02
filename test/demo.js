'use strict';


var mincer = require('../index');
var env = new (mincer.Environment)(__dirname + '/fixtures');


env.appendPath('app/assets/javascripts');
env.appendPath('app/assets/stylesheets');
env.appendPath('vendor/assets/stylesheets');


env.findAsset('app.css').compile(function (err, asset) {
  console.log('\n### Error of app.css:\n' + err);
  console.log('\n### Contents of app.css:\n' + asset.source);
});
