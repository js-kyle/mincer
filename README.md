Mincer - assets processor
=========================

[![Build Status](https://travis-ci.org/nodeca/mincer.svg?branch=master)](https://travis-ci.org/nodeca/mincer)
[![NPM version](https://img.shields.io/npm/v/mincer.svg)](https://www.npmjs.org/package/mincer)

JavaScript port of Sprockets (v2.10.0). It features same declarative dependency
management (with exactly same language) for CSS and JavaScript and preprocessor
pipeline. Mincer allows you to write assets in the languages like: CoffeeScript,
LESS, Stylus and others. Moreover mincer has advanced built-in features, not
available in sprockets:

- sourcemaps support
- macros support (nice alternative to EJS)

See [Sprockets](https://github.com/sstephenson/sprockets),
[Mincer API Documentation](http://nodeca.github.io/mincer/) and
[Mincer examples](https://github.com/nodeca/mincer/tree/master/examples)
for more details.

Supported engines are described in [Wiki](https://github.com/nodeca/mincer/wiki).
If you wish to add new engine support - read
[tutorial](https://github.com/nodeca/mincer/wiki/How-to-create-addon). Also
you can [search existing extentions](https://www.npmjs.org/browse/keyword/mincer-contrib)
in npm.


## Notice on upgrade 0.5.x -> 1.0.x

Sourcemaps support added. See docs and examples for details.

- `environment.enable('source_maps')`
- use `csswring` css compressor instead of `csso`, for sourcemaps support
- removed `/?body=1` stuff as replaced with sourcemaps
- removed `Asset.writeTo()` method.
- `Manifest.compile()` is now sync and throw exception on error.
- Removed non mainstream engines: eco, coco, haml-coffee, livescript.


## Installation

Install Mincer from npm registry:

    $ npm install mincer

Or install bleeding edge version from GitHub repo:

    $ npm install git://github.com/nodeca/mincer.git


## Using Mincer from CLI

To use Mincer from CLI, you will need to install it globally:

    $ npm install mincer -g

Usage is really simple (see `mincer -h` for details):

    $ mincer --include assets/javascripts \
             --include assets/stylesheets \
             --output public/assets \
             application.js application.css

If you are using mincer CLI often, you would probably want to "preset" some of
the options/arguments for your project. Just create `.mincerrc` file and put
argument you want in it. For example:

    --include assets/javascripts --include assets/stylesheets --output public/assets


## Understanding the Mincer Environment

You'll need an instance of the `Mincer.Environment` class to
access and serve assets from your application.

The `Environment` has methods for retrieving and serving assets, manipulating
the load path, and registering processors. It is also used by `Mincer.Server`
which can be mounted directly as `request` event handler of `http.Server` or
as `connect` middleware.


### The Load Path

The *load paths* is an ordered list of directories that Mincer uses to search
for assets.

In the simplest case, a Mincers environment's load path will consist
of a single directory containing your application's asset source
files. When mounted, server will serve assets from this directory as if
they were static files in your public root.

The power of the load path is that it lets you organize your source
files into multiple directories -- even directories that live outside
your application -- and combine those directories into a single
virtual filesystem. That means you can easily bundle JavaScript, CSS
and images into a library and import them into your application.


#### Manipulating the Load Path

To add a directory to your environment's load path, use the `appendPath` and
`prependPath` methods. Directories at the beginning of the load path have
precedence over subsequent directories.

``` javascript
environment = new Mincer.Environment();
environment.appendPath('app/assets/javascripts');
environment.appendPath('lib/assets/javascripts');
environment.appendPath('vendor/assets/jquery');
```

In general, you should append to the path by default and reserve
prepending for cases where you need to override existing assets.


### Accessing Assets

Once you've set up your environment's load path, you can mount the
environment as a server and request assets via HTTP. You can also
access assets programmatically from within your application.


#### Logical Paths

Assets in Mincer are always referenced by their *logical path*.

The logical path is the path of the asset source file relative to its
containing directory in the load path. For example, if your load path
contains the directory `app/assets/javascripts`:

<table>
  <tr>
    <th>Asset source file</th>
    <th>Logical path</th>
  </tr>
  <tr>
    <td>app/assets/javascripts/application.js</td>
    <td>application.js</td>
  </tr>
  <tr>
    <td>app/assets/javascripts/models/project.js</td>
    <td>models/project.js</td>
  </tr>
</table>

In this way, all directories in the load path are merged to create a
virtual filesystem whose entries are logical paths.


#### Serving Assets Over HTTP

When you mount an environment, all of its assets are accessible as
logical paths underneath the *mount point*. For example, if you mount
your environment at `/assets` and request the URL `/assets/application.js`,
Mincer will search your load path for the file named `application.js`
and serve it.

``` javascript
var connect = require('connect');
var Mincer  = require('mincer');

var environment = new Mincer.Environment();
environment.appendPath('app/assets/javascripts');
environment.appendPath('app/assets/stylesheets');

var app = connect();
app.use('/assets', Mincer.createServer(environment));
app.use(function (req, res) {
  // your application here...
});
```


#### Accessing Assets Programmatically

You can use the `findAsset` method to retrieve an asset from a Mincers
environment. Pass it a logical path and you'll get a `BundledAsset`
instance back.

Call `toString` on the resulting asset to access its contents, `length` to
get its length in bytes, `mtime` to query its last-modified time, and
`pathname` to get its full path on the filesystem.

``` javascript
var asset = environment.findAsset('application.js');

asset.toString(); // resulting contents
asset.length;     // length in bytes
asset.mtime;      // last modified time
asset.pathname;   // full path on the filesystem
```


## Using Engines

Asset source files can be written in another language, like Stylus or
CoffeeScript, and automatically compiled to CSS or JavaScript by
Mincer. Compilers for these languages are called *engines*.

Engines are specified by additional extensions on the asset source
filename. For example, a CSS file written in Stylus might have the name
`layout.css.styl`, while a JavaScript file written in CoffeeScript
might have the name `dialog.js.coffee`.


### Styling with Stylus

[Stylus](http://learnboost.github.com/stylus/) is a revolutionary new language,
providing an efficient, dynamic, and expressive way to generate CSS. Supporting
both an indented syntax and regular CSS style.

If the `stylus` Node module is available to your application, you can use Stylus
to write CSS assets in Mincer. Use the extension `.css.styl`.


### Styling with LESS

[LESS](http://lesscss.org/) extends CSS with dynamic behavior such as
variables, mixins, operations and functions.

If the `less` Node module is available to your application, you can use LESS
to write CSS assets in Mincer. Use the extension `.css.less`.


### Styling with SASS

[SASS](http://sass-lang.com/) is an extension of CSS3, adding nested rules, 
variables, mixins, selector inheritance, and more.

If the `node-sass` Node module is available to your application, you can use SASS
to write CSS assets in Mincer. Use the extension `.css.sass` or `.css.scss`.


### Scripting with CoffeeScript

[CoffeeScript](http://jashkenas.github.com/coffee-script/) is a
language that compiles to the "good parts" of JavaScript, featuring a
cleaner syntax with array comprehensions, classes, and function
binding.

If the `coffee-script` Node module is available to your application, you can use
CoffeeScript to write JavaScript assets in Mincer.
Use the extension `.js.coffee`.


### JavaScript Templating with Haml Coffee

Mincer supports JavaScript templates for client-side rendering of strings or
markup. JavaScript templates have the special format extension `.jst` and are
compiled to JavaScript functions.

When loaded, a JavaScript template function can be accessed by its logical path
as a property on the global `JST` object. Invoke a template function to render
the template as a string. The resulting string can then be inserted into the DOM.

```
// templates/hello.jst.hamlc
%div= Hello, %span= #{ @name }!
```

``` javascript
// application.js
//= require templates/hello
$("#hello").html(JST["templates/hello"]({ name: "Sam" }));
```

Mincer supports two template languages: [Haml Coffee][hamlc] and [Jade][jade].

If `coffee-script` and `haml-coffee` are available to your application, you can
use _Haml Cofee_ templates in Mincer. Haml Coffee templates have the extension
`.jst.hamlc`.

If `jade` Node module is available to your application, you can use _Jade_
templates in Mincer. Jade templates have the extension `.jst.jade`. To use
compiled templates you will need to require Jade [runtime][jade-runtime] before
calling renderer functions.

[hamlc]:         https://github.com/netzpirat/haml-coffee
[jade]:          https://github.com/visionmedia/jade
[jade-runtime]:  https://github.com/visionmedia/jade/blob/master/runtime.js


### Invoking JavaScript with EJS

**Note** see macros description for more convenient alternative.

Mincer provides an EJS engine for preprocessing assets using
embedded JavaScript code. Append `.ejs` to a CSS or JavaScript asset's
filename to enable the EJS engine.

You will need `ejs` Node module available to your application.

**Note**: Mincer processes multiple engine extensions in order from
  right to left, so you can use multiple engines with a single
  asset. For example, to have a CoffeeScript asset that is first
  preprocessed with EJS, use the extension `.js.coffee.ejs`.

JavaScript code embedded in an asset is evaluated in the context of a
`Mincer.Context` instance for the given asset. Common uses for EJS include:

- embedding another asset as a Base64-encoded `data:` URI with the
  `asset_data_uri` helper
- inserting the URL to another asset, such as with the `asset_path`
  helper (you must register your own helper for this purpose, but
  it's dead simple).
- embedding other application resources, such as a localized string
  database, in a JavaScript asset via JSON
- embedding version constants loaded from another file


### Using helpers

Mincer provides an easy way to add your own helpers for engines:

``` javascript
environment.registerHelper('version', function () {
  return require(__dirname, '/package.json').version;
});
```

Now, you can call that helper with EJS like this:

``` javascript
var APP = window.APP = {version: '<%= version() %>'};
```

**NOTICE** Helpers currently work for EJS and Stylus only. So to use them with
Less you will need to add EJS engine as well:

``` css
// file: foobar.less.ejs
.btn {
  background: url('<%= asset_path('bg.png') %>');
}
```

### Macros

This feature is designed as simple alternative to EJS, that does not requires
additional extention and does not break language syntax. When enabled, any
`'$$ expression $$'` or `"$$ expression $$"` pattern will be replaced with
evaluated expression value. In expression you can write JS code and use
registered helpers. Macros are off by default. You should enable those for
particular extentions:

```javascript
Mincer.MacroProcessor.configure(['.js', '.css']);
```


## Managing and Bundling Dependencies

You can create *asset bundles* -- ordered concatenations of asset
source files -- by specifying dependencies in a special comment syntax
at the top of each source file.

Mincer reads these comments, called *directives*, and processes
them to recursively build a dependency graph. When you request an
asset with dependencies, the dependencies will be included in order at
the top of the file.


### The Directive Processor

Mincer runs the *directive processor* on each CSS and JavaScript
source file. The directive processor scans for comment lines beginning
with `=` in comment blocks at the top of the file.

    //= require jquery
    //= require jquery-ui
    //= require backbone
    //= require_tree .

The first word immediately following `=` specifies the directive
name. Any words following the directive name are treated as
arguments. Arguments may be placed in single or double quotes if they
contain spaces, similar to commands in the Unix shell.

**Note**: Non-directive comment lines will be preserved in the final
  asset, but directive comments are stripped after
  processing. Mincer will not look for directives in comment blocks
  that occur after the first line of code.


#### Supported Comment Types

The directive processor understands comment blocks in three formats:

    /* Multi-line comment blocks (CSS, Stylus, JavaScript)
     *= require foo
     */

    // Single-line comment blocks (Stylus, JavaScript)
    //= require foo

    # Single-line comment blocks (CoffeeScript)
    #= require foo


### Mincer Directives

You can use the following directives to declare dependencies in asset
source files.

For directives that take a *path* argument, you may specify either a
logical path or a relative path. Relative paths begin with `./` and
reference files relative to the location of the current file.


#### The `require` Directive ###

`require` *path* inserts the contents of the asset source file
specified by *path*. If the file is required multiple times, it will
appear in the bundle only once.


#### The `include` Directive ###

`include` *path* works like `require`, but inserts the contents of the
specified source file even if it has already been included or
required.


#### The `require_directory` Directive ###

`require_directory` *path* requires all source files of the same
format in the directory specified by *path*. Files are required in
alphabetical order.


#### The `require_tree` Directive ###

`require_tree` *path* works like `require_directory`, but operates
recursively to require all files in all subdirectories of the
directory specified by *path*.


#### The `require_self` Directive ###

`require_self` tells Mincer to insert the body of the current
source file before any subsequent `require` or `include` directives.


#### The `depend_on` Directive ###

`depend_on` *path* declares a dependency on the given *path* without
including it in the bundle. This is useful when you need to expire an
asset's cache in response to a change in another file.


#### The `stub` Directive ###

`stub` *path* allows dependency to be excluded from the asset bundle.
The *path* must be a valid asset and may or may not already be part
of the bundle. Once stubbed, it is blacklisted and can't be brought
back by any other `require`.


## Credits

Great thanks to [Sam Stephenson][sam] and [Joshua Peek][josh] for the Sprockets,
the most awesome and powerfull web assets processor I ever used, and which
became a great source of inspiration (and model of almost all logic behind
Mincer). Special thanks to Joshua for his assistance in hacking into Sprockets
sources.

[sam]:  https://github.com/sstephenson
[josh]: https://github.com/josh


## Author

[Aleksey V Zapparov][github] (follow [@zapparov][twitter] on twitter).

[github]:   https://github.com/ixti
[twitter]:  https://twitter.com/zapparov


## License

Copyright (c) 2012 [Vitaly Puzrin](https://github.com/puzrin)

Released under the MIT license. See [LICENSE][license] for details.

[license]:  https://raw.github.com/nodeca/mincer/master/LICENSE
