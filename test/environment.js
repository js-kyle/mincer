'use strict';


var Mincer = require('..');

module.exports = function () {

  Mincer.MacroProcessor.configure([ '.js', '.css' ], true);

  var environment = new (Mincer.Environment)(__dirname);


  environment.appendPath('fixtures');


  environment.ContextClass.defineAssetPath(function (pathname, options) {
    var asset = environment.findAsset(pathname, options);
    return !asset ? null : ('/assets/' + asset.digestPath);
  });


  return  environment;
};
