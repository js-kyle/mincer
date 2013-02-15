/*jshint evil:true, strict:false*/
/*global describe:true, it:true, before:true */

var assert = require('assert'),
    path   = require('path'),
    fs     = require('fs'),
    _      = require('underscore'),
    Mincer = require('../lib/mincer');

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

function compileSource(data) {
  var source = data;
  source = source.split("\n").map(function (l) {
    return l.trim();
  }).join('\\n').trim();
  source = '"' + source.replace(/\{\{([^\}]+)\}\}/gi, '" + this.$1 + "');
  source = source.replace(/\[\[([^\]]+)\]\]/gi, '" + locals.$1 + "') + '"';
  return new Function('locals', 'return ' + source + ';');
}

function compileAsset(asset, callback) {
  assert.doesNotThrow(function () {
    asset.compile(function (err, ast) {
      if (err) { throw err; }
      var compiledAsset = ast;
      var callable = new Function(ast.toString());
      callback(compiledAsset, callable);
    });
  });
}

function generateDescriptionWithJST(assetName) {
  return function () {
    var compiledAsset,
        callable,
        locals,
        scope = {};
    var context = {
      id: 1,
      text: 'Caption'
    };

    before(function (done) {
      assert.doesNotThrow(function () {
        var asset  = env.findAsset(assetName);
        compileAsset(asset, function (compiled, fn) {
          compiledAsset = compiled;
          callable = fn;
          var ctx = contextualize(asset);
          context = _.extend(ctx[0], context);
          locals  = ctx[1];
          callable.call(scope);
          done();
        });
      });
    });

    it('should generate a JST object in the scope', function (done) {
      assert.ok(scope.JST, 'a JST object must be generated, no JST found');
      done();
    });

    it('should generate a template inside JST object', function (done) {
      assert.ok(scope.JST[assetName],
        'a member named by the assetName without extension, must be ' +
        'generated inside JST object, no JST[' + assetName + '] found.');
      done();
    });

    it('should generate a template function inside JST object', function (done) {
      assert.ok(scope.JST[assetName] instanceof Function,
        'the member of JST object named by the assetName without extension ' +
        'must be a function');
      done();
    });

    it('should generate a template function that renders correctly', function (done) {
      var source = fs.readFileSync(compiledAsset.pathname, 'utf8').trim();
      assert.equal(compileSource(source).call(context, locals).trim(),
                   scope.JST[assetName].call(context, locals).trim());
      done();
    });
  };
}

function generateDescription(engineExtension, engineFileName, returnLazySource) {
  return function () {
    var EngineClass = require(path.resolve(__dirname +
    '/fixtures/app/assets/javascripts/' + engineFileName + '.js'));
    env.registerEngine('.' + engineExtension,  EngineClass);

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

    describe('without JST', function () {
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
        it('should evaluate lazy', function (done) {
          assert.ok(!_.isString(result) && result instanceof EngineClass,
            'should evaluate lazy, but a string was passed to the callback. ' +
            'Expected the template object itself.');
          assert.ok(result.lazySource && _.isFunction(result.lazySource),
            'a lazySource function must be generated in the template object');
          assert.ok(result.toString && _.isFunction(result.toString),
            'a toString method must be generated in the template object');
          done();
        });

        describe('#lazySource()', function () {
          it('should convert properly', function (done) {
            assert.equal(myStrip(compiledSource.call(context[0], context[1])),
                         myStrip(result.lazySource.call(context[0], context[1])));
            done();
          });
        });

        describe('#toString()', function () {
          it('should convert properly', function (done) {
            assert.equal(myStrip(compiledSource.call(context[0], context[1])),
                         myStrip(result.toString()));
            done();
          });
        });
      } else {
        it('should evaluate passing a string to the callback.', function (done) {
          assert.ok(_.isString(result),
            'Passed result is ' + (typeof result) + '. String expected');
          done();
        });

        it('should convert properly', function (done) {
          var renderized = new Function('locals', 'return ' + result +
            '.call(this, locals)');
          assert.equal(myStrip(compiledSource.call(context[0], context[1])),
                       myStrip(renderized.call(context[0], context[1])));
          done();
        });
      }
    });

    describe('with JST', generateDescriptionWithJST('templates/figure-str'));
  };
}

describe('class StrEngine < Template', generateDescription('str', 'str_engine', false));
describe('class LzyEngine < Template', generateDescription('lzy', 'lzy_engine', true));