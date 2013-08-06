Mincer Examples
===============

Examples of Mincer usage.

- `server.js`:    Example of using Mincer's server for serving assets
- `manifest.js`:  Example of useng Mincer's manifest compiler

You will need install some additional modules in order to run these examples:

    npm install connect less jade coffee-script haml-coffee ejs \
      uglify-js csso autoprefixer


Assets middleware server demo
-----------------------------

Run:

    node ./server.js


Precompiling assets (Manifest usage)
------------------------------------

Run:

    node ./manifest.js


Development VS Production mode
------------------------------

By default this demo is running in _development_ mode. That means that it will
recompile (server) any changed asset on demand. Also it's not compressing
JavaScript and/or Stylesheets in development mode. To run mincer server and
manifest in production-ready mode, use `NODE_ENV=production` environment
variable, like so:

    NODE_ENV=production node ./server.js
