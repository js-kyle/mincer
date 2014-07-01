/**
 *  class MacroProcessor
 *
 *  `MacroProcessor` is simple and effective replacement for EJS, when user
 *  needs just embed constants into file. Macros content is replaced with
 *  evaluated value. You can use all mincer helpers (locals) in expression.
 *
 *  ##### Example of use:
 *
 *  ```javascript
 *  var url = "'$$ asset_path('/vendor/jquery') $$'";
 *  var str = '"$$ function () { var foo = my_super_helpers(5) + 23; return foo; } $$"';
 *  var str = '$$ JSON.stringify(asset_path("/vendor/jquery")) $$';
 *  ```
 *
 *  MacroProcessor processor is always on, but not assigned to any file
 *  extention. You can enable macros with `configure()` method.
 *
 *  ##### Example of configure:
 *
 *  ```javascript
 *  var mincer = require('mincer');
 *
 *  // Enable for `.js` / `.css` / `.jade`
 *  mincer.Macro.configure(['.js', '.css', '.jade']);
 *
 *  // Enable for `.js` only
 *  mincer.Macro.configure('.js', true);
 *  ```
 *
 *  ##### SUBCLASS OF
 *
 *  [[Template]]
 **/


'use strict';


var format = require('util').format;


// internal
var Template = require('../template');


////////////////////////////////////////////////////////////////////////////////


// Class constructor
var MacroProcessor = module.exports = function MacroProcessor() {
  Template.apply(this, arguments);
};

require('util').inherits(MacroProcessor, Template);


// Internal (private) config storage
var config = {};
var DEFAULT_RULES = [ /'\$\$([^\r\n]+?)\$\$'/g, /"\$\$([^\r\n]+?)\$\$"/g ];

/**
 *  MacroProcessor.configure(extention, enable) -> Void
 *  - extention (String|Array): extention or array of extentions to process
 *  - enable (Boolean): `false` - disable, `true` or undefined - enable
 *
 *  on / off macroses for specified extentions.
 *
 *
 *  ##### Example
 *
 *  ```javascript
 *  // Enable for `.js` / `.css` / `.jade`
 *  MacroProcessor.configure(['.js', '.css', '.jade']);
 *  MacroProcessor.configure(['.js', '.css', '.jade'], true);
 *
 *  // Enable for `.js` only
 *  MacroProcessor.configure('.js', true);
 *  ```
 **/
MacroProcessor.configure = function (extention, enable) {
  extention = Array.isArray(extention) ? extention : [ extention ];

  // normalize extention format ('js' -> '.js')
  extention = extention.map(function (ext) {
    return ext[0] === '.' ? ext : '.' + ext;
  });

  extention.forEach(function (ext) {
    if (enable === false) {
      config[ext] = null;
      return;
    }

    config[ext] = DEFAULT_RULES;
  });
};


// cache generated functions, to buid new one only if `locals` change.
var evaluatorCache = {};


// Replace macros
MacroProcessor.prototype.evaluate = function (context, locals) {
  var body = '', ext,
      key = Object.keys(locals).toString();

  // search nearest extention, that has enabled macros rules
  ext = context.environment.attributesFor(context.pathname).extensions
          .reverse()
          .filter(function (extention) {
            return !!config[extention];
          })[0];

  if (!ext) {
    return;
  }

  // create evaluator wrapper
  if (!evaluatorCache.hasOwnProperty(key)) {
    // build function, that allow macto to access `local` keys by name directly.
    Object.keys(locals).forEach(function(key) {
      body += 'var ' + key + ' = __locals.' + key + ';\n';
    });
    body += 'return eval(data);\n';
    /*jshint evil:true*/
    evaluatorCache[key] = new Function('data', '__locals', body);
  }

  var result = this.data;

  config[ext].forEach(function(rule) {
    result = result.replace(rule, function (match, value, offset, orig) {
      try {
        return evaluatorCache[key](value, locals);
      } catch (e) {
        // Fill error message
        context.__LINE__ = orig.slice(0, offset).split(/\r?\n/).length;
        throw new Error(format('Failed to evaluate macro `%s` [%s]',
                        value.trim(), e.message));
      }
    });
  });

  this.data = result;
};
