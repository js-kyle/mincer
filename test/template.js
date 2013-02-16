/*global describe, it, before*/

'use strict';

var assert  = require('assert')
  , path    = require('path')
  , fs      = require('fs')
  , vm      = require('vm')
  , _       = require('underscore')
  , Mincer  = require('../lib/mincer');

Mincer.logger.use(console); // provide logger backend

var env = new Mincer.Environment(__dirname + '/fixtures'),
    assetPath = 'app/assets/javascripts';

env.appendPath(assetPath);

env.registerHelper('k', function (arg) {
  return arg;
});

env.registerHelper('asset_data_uri', function (arg) {
  return arg;
});

function remove_trailing_spaces(str) {
  return str.split("\n").map(function (l) {
    // Strip all comments, trailing spaces and ';' at the and of line
    // to make easy to compare javascript code
    return l.replace(/(;*\s*;*)?(\/\*(.*)\*\/)?(;*\s*;*)?$/gi, '');
  }).join('\n').trim();
}

function contextualize(asset) {
  var locals  = {},
      context = new env.ContextClass(env, asset.logicalPath, asset.pathname);
  _.each(context.__helpers__, function (helper, name) {
    locals[name] = function () {
      return helper.func.apply(context, arguments);
    };
  });
  return [context, locals];
}

function compileFunction(args, body) {
  var len = arguments.length;

  if (len < 1) {
    args = [];
    body = '';
  } else {
    body = arguments[len - 1];
    args = [].slice.call(arguments, 0, len - 1);
  }

  var scope  = {}
    , source = 'this.result = function(' +
                args.join(', ') + ') { ' + body + ' };';

  vm.runInNewContext(source, scope, 'function.vm');
  return scope.result;
}

function compileSource(data) {
  var source = data;

  source = source.split("\n").map(function (l) {
    return l.trim();
  }).join('\\n').trim();

  source = '"' + source.replace(/\{\{([^\}]+)\}\}/gi, '" + this.$1 + "');
  source = source.replace(/\[\[([^\]]+)\]\]/gi, '" + locals.$1 + "') + '"';
  return compileFunction('locals', 'return ' + source + ';');
}

function compileAsset(asset, callback) {
  assert.doesNotThrow(function () {
    asset.compile(function (err, compiledAsset) {
      if (err) { throw err; }
      callback(compiledAsset);
    });
  });
}

function generateDescriptionWithJST(assetName) {
  return function () {
    describe('Template', function () {
      var compiledAsset,
          locals,
          scope = {};
      var context = {
        id: 1,
        text: 'Caption'
      };

      before(function (done) {
        assert.doesNotThrow(function () {
          var asset  = env.findAsset(assetName);
          compileAsset(asset, function (compiled) {
            compiledAsset = compiled;
            var ctx = contextualize(asset);
            context = _.extend(ctx[0], context);
            locals  = ctx[1];
            vm.runInNewContext(compiled.toString(), scope, 'asset.vm');
            done();
          });
        });
      });

      it('should generate a JST object in the scope', function () {
        assert.ok(scope.JST, 'a JST object must be generated, no JST found');
      });

      it('should generate a template inside JST object', function () {
        assert.ok(scope.JST[assetName],
          'a member named by the assetName without extension, must be ' +
          'generated inside JST object, no JST[' + assetName + '] found.');
      });

      it('should generate a template function inside JST object', function () {
        assert.ok(_.isFunction(scope.JST[assetName]),
          'the member of JST object named by the assetName without extension ' +
          'must be a function');
      });

      it('should generate a template function that renders correctly', function () {
        var source = fs.readFileSync(compiledAsset.pathname, 'utf8').trim();
        assert.equal(compileSource(source).call(context, locals).trim(),
                     scope.JST[assetName].call(context, locals).trim());
      });
    });
  };
}

function generateDescription(engineExtension, engineFileName, returnLazySource) {
  return function () {
    var EngineClass = require(path.resolve(__dirname +
    '/fixtures/app/assets/javascripts/' + engineFileName + '.js'));
    env.registerEngine('.' + engineExtension,  EngineClass);

    describe('Environment', function () {
      it('should find assets', function (done) {
        assert.doesNotThrow(function () {
          var assetName = 'templates/figure-' + engineExtension,
              fileName  = path.resolve(__dirname + '/fixtures/app/assets/javascripts/' +
            assetName + '.jst.' + engineExtension);
          assert.ok(fs.existsSync(fileName));
          assert.equal(fileName, env.findAsset(assetName).pathname);
          done();
        });
      });
    });

    describe('Asset [.js.' + engineExtension + ']', function () {
      describe('Template', function () {
        var asset,
            source,
            context,
            result,
            compiledSource,
            assetName = 'variable-' + engineExtension,
            myStrip   = remove_trailing_spaces;

        before(function (done) {
          asset   = env.findAsset(assetName);
          source  = fs.readFileSync(asset.pathname, 'utf8').trim();
          context = contextualize(asset);
          compiledSource = compileSource(source);

          var template = new EngineClass(asset.pathname, function () {
            return source;
          });

          template.evaluate(context[0], context[1], function (err, data) {
            if (err) { throw err; }
            result = data;
            done();
          });
        });

        if (returnLazySource) {
          describe('#evaluate(context, locals, callback)', function () {
            it('should be lazy', function () {
              assert.ok(!_.isString(result) && result instanceof EngineClass,
                'should evaluate lazy, but a string was passed to the callback. ' +
                'Expected the template object itself.');
              assert.ok(result.lazySource && _.isFunction(result.lazySource),
                'a lazySource function must be generated in the template object');
              assert.ok(result.toString && _.isFunction(result.toString),
                'a toString method must be generated in the template object');
            });
          });

          describe('#lazySource()', function () {
            it('should convert properly to string', function () {
              assert.equal(myStrip(compiledSource.call(context[0], context[1])),
                           myStrip(result.lazySource.call(context[0], context[1])));
            });
          });

          describe('#toString()', function () {
            it('should convert properly to string', function () {
              assert.equal(myStrip(compiledSource.call(context[0], context[1])),
                           myStrip(result.toString()));
            });
          });
        } else {
          describe('#evaluate(context, locals, callback)', function () {
            it('should pass a string as result to the callback.', function () {
              assert.ok(_.isString(result),
                'Passed result is ' + (typeof result) + '. String expected');
            });

            describe('result', function () {
              it('should render properly when evaluated', function () {
                var renderized = compileFunction('locals', 'return ' + result +
                  '.call(this, locals);');
                assert.equal(myStrip(compiledSource.call(context[0], context[1])),
                             myStrip(renderized.call(context[0], context[1])));
              });
            });
          });
        }
      });
    });

    describe('Asset [.jst.' + engineExtension + ']',
             generateDescriptionWithJST('templates/figure-' + engineExtension));
  };
}

describe('class StrEngine < Template', generateDescription('str', 'str_engine', false));
describe('class LzyEngine < Template', generateDescription('lzy', 'lzy_engine', true));