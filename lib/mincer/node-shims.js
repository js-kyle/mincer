var fs    = require('fs');
var path  = require('path');

if ('0.6' === process.version.split('.').slice(0, 2).join('.')) {
  fs.exists     = path.exists;
  fs.existsSync = path.existsSync;
}
