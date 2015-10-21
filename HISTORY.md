master / unreleased
-------------------

- Internal API updates.
  - `autoprefixer-core` -> `autoprefixer`


1.3.1 / 2015-09-05
------------------

- (!) Added `node-sass` sourcemaps support, thanks to @inukshuk.
- Added support for `node-sass` helpers, errors and confuguration. Thanks to
  @inukshuk & @rhyzx.


1.3.0 / 2015-06-24
------------------

- Updated API compatibility for postcss-related modules (autoprefixer, csswring).
  Now you have to add `postcss` dependency to make those work right. Thanks to
  @netsgnut.
- Version bump to notify users about possible `postcss` dependency.


1.2.5 / 2015-06-09
------------------

- SASS engine: pass file name, thanks to @cgc.
- LESS engine: improved deps (imports) tracking for 2.0+, thanks to @alexanderweiss.
- EJS 2.0+ support, thanks to @jeremyruppel.


1.2.4 / 2015-02-22
------------------

- Added node-sass 2.0 support, thanks to @gabooh.


1.2.3 / 2015-02-07
------------------

- Fixed examples compatibility with LESS 2.x (#182, thanks to @tikotzky)
- Loger improvements (#176, thanks to @jisaacks)
  - added `.level()` method
  - methods are now chainable
  - tests
- Fixed iteration over bower main files (#166, thanks to @mileszim)
- Fixed SASS indented style support (#184, thanks to @rodrigoscna)
- Bumped `mimoza` dependency & updated api calls appropriately.


1.2.2 / 2014-12-17
------------------

- Added LESS 2.0 support, thanks to @tikotzky.


1.2.1 / 2014-12-04
------------------

- Better csswring options - don't break IE hacks, clear all comments,
  #171, thanks to @tortuetorche.


1.2.0 / 2014-12-02
------------------

- Internal API updates. Need more fresh dependencies in your projects:
  - `autoprefixer` -> `autoprefixer-core`
  - `csswring` v1 -> v2
- Don't search bower's deprecated `component.json` anymore.
- Fixed broken line maping in `safety_colons` processor, when content starts
  with empty string (affected coffescripts, started with block comment).


1.1.3 / 2014-08-17
------------------

- Fixed `stub` directive (#144).


1.1.2 / 2014-07-26
------------------

- Fixed generated sourcemaps to work in Firefox, #151.
- Bumped `hike` dependency (should work faster now)


1.1.1 / 2014-07-16
------------------

- Fixed jade `include` support.


1.1.0 / 2014-07-03
------------------

- (!) Added macros support. No more need to use ejs for embedding inline
  variables.


1.0.5 / 2014-06-23
------------------

- Fixed bower packages loading. Always load first file,
  if array specified (#147).


1.0.4 / 2014-06-09
------------------

- Maintenance release (updated pako dependency).


1.0.3 / 2014-05-16
------------------

- Improved reporting on SASS errors.


1.0.2 / 2014-03-31
------------------

- Allow pass plain objects as helpers.


1.0.1 / 2014-03-25
------------------

- Bugfixes for mode without source maps.


1.0.0 / 2014-03-25
------------------

- NEW. Finally, added sourcemaps support.
- Removed `/?body=1` - not needed anymore, after sourcemaps added.
- Removed `Asset.writeTo()` method.
- `Manifest.compile()` are now sync and throw exception on error.
- Removed non mainstream engines: eco, coco, haml-coffee, livescript.
- Wiki tutorial, how to create addons with new engines support.
- Reworked example.
- Don't strip mincer directives from generated files
- added `csswring` compressor, as alternative to `csso` -
  less features, but or with sourcemaps support.
- Added support for coffee-script block comments
- Fix root path comparison, #124
- Improved `bower.json` support, #134
- Logger now prefer to use `originalUrl` if exists
- Removed patches of old LESS support. Just upgrate LESS too.


0.5.13 / 2014-01-13
-------------------

- Added compatibility with Jade 1.0.0+ API.
- Added compatibility with AutoPrefixer 1.0.0+ API.
- Removed `deflate` support as useless & not safe (see #118 for details).
- Simplified server logic.
- Examples/readme fixes.


0.5.12 / 2013-11-06
-------------------

- Fixed custom processor declaration (@kramerc).
- Allow configure options of UglifyJS.


0.5.11 / 2013-10-24
-------------------

- Rolled back uglifier defaults, since last update caused Safari bugs.
  See https://github.com/mishoo/UglifyJS2/issues/326 . If you have speed
  issues - make sure, that input javascripts are not minified.
- Added LiveScript support (@tomchentw)


0.5.10 / 2013-10-17
-------------------

- Disable `compress` option for `UglifyJS` by default. (!!!) That DOES NOT
  disable minification, just some options. Using `compress` gives just 1% gain
  on gzipped result, but can cause huge performance loss if mincer receives
  already minified file on input.


0.5.9 / 2013-10-12
------------------

- Fixed regression caused ignore of js/css compressions.


0.5.8 / 2013-09-15
------------------

- Allow use all JST engines as in-middle pipeline processors. That allows to
  have `*.jst.hbs.jade` that will generate Handlebars JST from HTML generated
  with Jade.


0.5.7 / 2013-08-15
------------------

- Significantly boosted cache speed


0.5.6 / 2013-08-07
------------------

- Fix SASS engine, to follow new SASS api. SASS 0.5.0+ required


0.5.5 / 2013-08-06
------------------

- Fixed broken circular dependency protector
- Added `autoprefixer` support
- Added simplified way to enable/disable processors
- Added location info for CoffeeScript compiler error (thanks to @grindars)


0.5.4 / 2013-08-06
------------------

- Fixed `eco` engine
- Fixed gzipped asets generation
- Synced with `sprockets` 2.10.0


0.5.3 / 2013-08-01
------------------

- Fixed `less` helpers & added `less` tests (thanks to @btd)


0.5.2 / 2013-07-22
------------------

- Fixed assets unserialisation from cache


0.5.1 / 2013-07-17
------------------

- Added compilation cache. Usage:
  `env.cache = new Mincer.FileStore("/path/to/cache");`
- Minor fixes


0.5.0 / 2013-07-01
------------------

- API cleanup
  - removed lazySources stuff, due bad implementation
  - setting options in engines renamed to `configure` (unified name)
  - simplified engines init
  - removed compile() method in favor of synchronous compilations
- Added `Template.lib` hash to override libriaries, used by default
- Added `bower.json` support
- Added embedded JS/CSS compressors (`csso` & `uglify`)
- Improved windows support ('\' separators in paths)


0.4.6 / 2013-04-23
------------------

- Added support for literate CoffeeScript `.litcoffee`. Closes #73.
- Added `Coco` (Coffescript dialect) support, thanks to @utkarshkukreti
- Added preliminary engines cache (currently for LESS only)
- Improved visual look for 404 and other errors (show text in reply body)
- Improved BSD compatibility, thanks to @utkarshkukreti
- Improved `node_sass` support. Closes #76, thanks to @joshuairl.


0.4.5 / 2013-02-17
------------------

- Added ECO engine (thanks to @abravalheri).
- Allow use EJS as JST engine alongside as processor (thanks to @abravalheri).
- Improve Windows support (thanks to @abravalheri).


0.4.4 / 2013-01-26
------------------

- Expose original HTTP request object inside Server log event.
- Provide filename for EJS engine (thanks to @CamShaft)


0.4.3 / 2013-01-02
------------------

- Fix for LESS > v1.3.2 (improved paths calculation)


0.4.2 / 2013-01-02
------------------

- Added SASS support (thanks to @moddular)
- Fixed Paths#clearPaths helper.
- Simplify `asset_path` (and dependent built-in) hepers registration.


0.4.1 / 2012-11-06
------------------

- Fix extensionless assets path resolving


0.4.0 / 2012-10-30
------------------

- Added bower component.json require support
- Provide stubbed implementation of context `-_path` helpers
- Sync with Sprockets up to v2.6.0


0.3.1 / 2012-10-13
------------------

- Improve and fix typos in usage examples. Closes #35.
- Improve work with extension-less requires.
- Sync with Sprockets up to v2.4.5


0.3.0 / 2012-09-13
------------------

- Add JST support. Haml Coffee became JST backend. Closes #7.
- Add Jade JST backend.
- Fix directive processor to work on M$ Windows. Closes #30.
- Fix example server compression usage. Closes #32.
- Fix call-stack overflow on massive requires. Closes #31.
- Monitor stylus `@import` and auto-depend-on them. Closes #23.
- Fix error reporting to show file that cause error. Closes 26.


0.2.7 / 2012-08-10
------------------

- Forced UTF-8 charset for text assets, to avoid problems with JS loaders


0.2.6 / 2012-08-09
------------------

- Allow request non-bundled assets (without dependencies). Closes #15.
- Fix problem with CoffeScript options got mangled by compiler. Closes #17.
- Add Haml Coffee Engine support. Related to #16.


0.2.5 / 2012-07-25
------------------

- Use `process.hrtime()` for timer when available.
- Allow using custom `Server` logging by providing `#log()` method.


0.2.4 / 2012-07-25
------------------

- Fix assets fresh/stale checks. Closes #13.


0.2.3 / 2012-07-06
------------------

- Allow specify options of the CoffeeScript engine. Closes #11.


0.2.2 / 2012-06-26
------------------

- Update Node API for 0.8 compatibility with shims for Node 0.6.


0.2.1 / 2012-06-25
------------------

- Update dependencies to be node v0.8 compatible.


0.2.0 / 2012-06-19
------------------

- Fix typo in Base#findAsset() fo Manifest.
- Fix Asset#digestPath getter. Now it does not drops `path` component.
- Fix extension aliases registration. Now `app.css` will match:
  `app.css`, `app.styl`, `app.less`, `app.css.styl`, etc.
- Improve js/css compressors, now these functions accept `context` along with
  `data` of asset.
- Fixed RegExp generation for `Base#eachLogicalPath` calls.


0.1.4 / 2012-06-11
------------------

- Do not compress small assets (less than 500KB). See #8.
- Fix DirectiveProcessor `require_self` and some other command handlers `this`
  scope. Fixes #9.
- Drop support of `If-Modified-Since` header check - using only ETags.
- Add Asset#isCompiled flag.
- Small fixes and code improvements.


0.1.3 / 2012-05-26
------------------

- Fix `If-None-Match` header test (304 reply)
- Add test of `If-Modified-Since` header for assets server
- Added more headers to 304 reply


0.1.2 / 2012-05-25
------------------

- Improved examples.
- Added `Environment#precompile()` for making sure assets are "fresh" and
  compiled without using Manifest - for development purposes.
- Improved error reporting of jsCompressor/cssCompressor.
- Fix timer's output.


0.1.1 / 2012-05-17
------------------

- Added CLI script `mincer` to build assets.


0.1.0 / 2012-05-15
------------------

- First release.
