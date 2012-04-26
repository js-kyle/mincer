'use strict';


// 3rd-party
var _ = require('underscore');


// internal
var EngineTemplate = require('./engine_template');
var prop = require('./common').prop;
var getter = require('./common').getter;
var shellwords = require('./common').shellwords;


var HEADER_PATTERN = new RegExp(
  '^(?:\\s*' +
    '(' +
      '(?:\/[*](?:\\s*|.+?)*?[*]\/)' + '|' +
      '(?:\/\/.*\n?)+' + '|' +
      '(?:#.*\n?)+' +
    ')*' +
  ')*', 'm');


var DIRECTIVE_PATTERN = new RegExp('^[\\W]*=\\s*(\\w+.*?)([*]\/)?$');


var DirectiveProcessor = module.exports = function DirectiveProcessor() {
  EngineTemplate.apply(this, arguments);
};


require('util').inherits(DirectiveProcessor, EngineTemplate);


DirectiveProcessor.prototype.prepare = function () {
  var header = (HEADER_PATTERN.exec(this.data) || []).shift() || '';

  prop(this, 'pathname', this.file);
  prop(this, 'header', header);
  prop(this, 'body', this.data.substr(header.length) + "\n");
  prop(this, 'included_pathnames', []);
};



DirectiveProcessor.prototype.render = function (context, locals, fn) {
  prop(this, 'context', context);
  prop(this, 'result', '');

  // processDirectives()
  // processSource()

  //fn(null, this.result);
  fn(null, this.processedSource);
};


function is_directive(directives, lineno) {
  return _.any(directives, function (arr) { return arr[0] === lineno; });
}

/**
 *  DirectiveProcessor#processedHeader -> String
 *
 *  Returns the header String with any directives stripped.
 **/
getter(DirectiveProcessor.prototype, 'processedHeader', function () {
  if (!this.__processed_header__) {
    this.__processed_header__ = this.header.split(/\n/).map(function (line, index) {
      return is_directive(this.directives, index + 1) ? "\n" : line;
    }, this).join("\n").trimLeft().trimRight();
  }

  return this.__processed_header__;
});


/**
 *  DirectiveProcessor#processedSource -> String
 *
 *  Returns the source String with any directives stripped.
 **/
getter(DirectiveProcessor.prototype, 'processedSource', function () {
  if (!this.__processed_source__) {
    this.__processed_source__ = this.processedHeader + this.body;
  }

  return this.__processed_source__;
});


/**
 *  DirectiveProcessor#directives -> Array
 *
 *  Returns an Array of directive structures. Each structure
 *  is an Array with the line number as the first element, the
 *  directive name as the second element, followed by any
 *  arguments.
 *
 *      [[1, "require", "foo"], [2, "require", "bar"]]
 **/
getter(DirectiveProcessor.prototype, 'directives', function () {
  if (!this.__directives__) {
    prop(this, '__directives__', []);

    this.header.split(/\n/).forEach(function (line, index) {
      var matches = DIRECTIVE_PATTERN.exec(line), name, args;

      if (matches && matches[1]) {
        args = shellwords(matches[1]);
        name = args.shift();

        if (_.isFunction(this["process_" + name + "_directive"])) {
          this.__directives__.push([index + 1, name].concat(args));
        }
      }
    }, this);
  }

  return this.__directives__;
});
