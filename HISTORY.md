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
