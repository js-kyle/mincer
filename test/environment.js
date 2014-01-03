'use strict';


module.exports = function () {
  var environment = new (require('..').Environment)(__dirname);


  environment.appendPath('fixtures');


  environment.ContextClass.defineAssetPath(function (pathname, options) {
    var asset = environment.findAsset(pathname, options);
    return !asset ? null : ('/assets/' + asset.digestPath);
  });


  return  environment;
};
