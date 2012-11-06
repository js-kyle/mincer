0.4.1 / 2012-11-06
------------------

* Fix extensionless assets path resolving


0.4.0 / 2012-10-30
------------------

* Added bower component.json require support
* Provide stubbed implementation of context `*_path` helpers
* Sync with Sprockets up to v2.6.0


0.3.1 / 2012-10-13
------------------

* Improve and fix typos in usage examples. Closes #35.
* Improve work with extension-less requires.
* Sync with Sprockets up to v2.4.5


0.3.0 / 2012-09-13
------------------

* Add JST support. Haml Coffee became JST backend. Closes #7.
* Add Jade JST backend.
* Fix directive processor to work on M$ Windows. Closes #30.
* Fix example server compression usage. Closes #32.
* Fix call-stack overflow on massive requires. Closes #31.
* Monitor stylus `@import` and auto-depend-on them. Closes #23.
* Fix error reporting to show file that cause error. Closes 26.


0.2.7 / 2012-08-10
------------------

* Forced UTF-8 charset for text assets, to avoid problems with JS loaders


0.2.6 / 2012-08-09
------------------

* Allow request non-bundled assets (without dependencies). Closes #15.
* Fix problem with CoffeScript options got mangled by compiler. Closes #17.
* Add Haml Coffee Engine support. Related to #16.


0.2.5 / 2012-07-25
------------------

* Use `process.hrtime()` for timer when available.
* Allow using custom `Server` logging by providing `#log()` method.


0.2.4 / 2012-07-25
------------------

* Fix assets fresh/stale checks. Closes #13.


0.2.3 / 2012-07-06
------------------

* Allow specify options of the CoffeeScript engine. Closes #11.


0.2.2 / 2012-06-26
------------------

* Update Node API for 0.8 compatibility with shims for Node 0.6.


0.2.1 / 2012-06-25
------------------

* Update dependencies to be node v0.8 compatible.


0.2.0 / 2012-06-19
------------------

* Fix typo in Base#findAsset() fo Manifest.
* Fix Asset#digestPath getter. Now it does not drops `path` component.
* Fix extension aliases registration. Now `app.css` will match:
  `app.css`, `app.styl`, `app.less`, `app.css.styl`, etc.
* Improve js/css compressors, now these functions accept `context` along with
  `data` of asset.
* Fixed RegExp generation for `Base#eachLogicalPath` calls.


0.1.4 / 2012-06-11
------------------

* Do not compress small assets (less than 500KB). See #8.
* Fix DirectiveProcessor `require_self` and some other command handlers `this`
  scope. Fixes #9.
* Drop support of `If-Modified-Since` header check - using only ETags.
* Add Asset#isCompiled flag.
* Small fixes and code improvements.


0.1.3 / 2012-05-26
------------------

* Fix `If-None-Match` header test (304 reply)
* Add test of `If-Modified-Since` header for assets server
* Added more headers to 304 reply


0.1.2 / 2012-05-25
------------------

* Improved examples.
* Added `Environment#precompile()` for making sure assets are "fresh" and
  compiled without using Manifest - for development purposes.
* Improved error reporting of jsCompressor/cssCompressor.
* Fix timer's output.


0.1.1 / 2012-05-17
------------------

* Added CLI script `mincer` to build assets.


0.1.0 / 2012-05-15
------------------

* First release.
