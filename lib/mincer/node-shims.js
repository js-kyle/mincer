var fs    = require('fs');
var path  = require('path');

if ('v0.6' === process.version.split('.').slice(0, 2).join('.')) {
  fs.exists     = path.exists;
  fs.existsSync = path.existsSync;
}
