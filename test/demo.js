'use strict';


var mincer = require('../index');
var env = new (mincer.Environment)(__dirname + '/fixtures');


env.appendPath('app/assets/javascripts');
env.appendPath('app/assets/stylesheets');
env.appendPath('vendor/assets/stylesheets');


env.findAsset('app.js').compile(function (err, asset) {
  console.log('\n### Error of app.js:\n' + err);
  console.log('\n### Contents of app.js:\n' + asset.source);
});
