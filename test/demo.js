'use strict';


var mincer = require('../index');
var env = new (mincer.Environment)(__dirname + '/fixtures');


// provide logger backend
mincer.logger.use(console);


env.appendPath('app/assets/images');
env.appendPath('app/assets/javascripts');
env.appendPath('app/assets/stylesheets');
env.appendPath('vendor/assets/stylesheets');
env.appendPath('vendor/assets/javascripts');


var manifest = new (mincer.Manifest)(env, __dirname + '/assets');


manifest.compile(['app.css', 'app.js', 'issue-16.js', 'header.jpg', 'README.md'], function (err, manifest) {
  if (err) {
    console.error(err.stack || err.message || err);
    return;
  }

  console.log(require('util').inspect(manifest));
});
