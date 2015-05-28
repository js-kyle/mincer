#!/usr/bin/env node

'use strict';


// stdlib
var fs    = require('fs');
var path  = require('path');


// 3rd-party
var ArgumentParser  = require('argparse').ArgumentParser;
var shellwords      = require('shellwords').split;


// internal
var Mincer      = require('..');


////////////////////////////////////////////////////////////////////////////////


var cli = new ArgumentParser({
  prog:     'mincer',
  version:  require('../package.json').version,
  addHelp:  true
});


cli.addArgument([ '--noenv' ], {
  help:         'Disables .mincerrc file',
  action:       'storeTrue'
});

cli.addArgument([ '-I', '--include' ], {
  help:         'Adds the directory to the Mincer load path',
  metavar:      'DIRECTORY',
  action:       'append',
  required:     true
});

cli.addArgument([ '-o', '--output' ], {
  help:         'Copy provided assets into DIRECTORY',
  metavar:      'DIRECTORY'
});

cli.addArgument([ 'filenames' ], {
  help:         'File(s) to process',
  metavar:      'FILE',
  nargs:        '+'
});


////////////////////////////////////////////////////////////////////////////////


if (-1 === process.argv.indexOf('--noenv')) {
  if (fs.existsSync('.mincerrc')) {
    var rcflags = fs.readFileSync('.mincerrc', 'utf8').replace(/^#.*/gm, '');
    [].splice.apply(process.argv, [ 2, 0 ].concat(shellwords(rcflags)));
  }
}


var args        = cli.parseArgs();
var environment = new Mincer.Environment(process.cwd());
var filenames   = [];


(process.env.MINCER_PATH || '').split(':').forEach(function (path) {
  if (path) {
    environment.appendPath(path);
  }
});

args.include.forEach(function (path) {
  environment.appendPath(path);
});

args.filenames.forEach(function (file) {
  filenames.push(path.normalize(file));
});


////////////////////////////////////////////////////////////////////////////////


//
// Configure Mincer logger
//


Mincer.logger.use(console);


//
// Compiling manifest with bunch of files
//

/*eslint-disable no-console*/

if (args.output) {
  var manifest = new Mincer.Manifest(environment, args.output);

  try {
    manifest.compile(filenames);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }

  process.exit(0);
}


if (filenames.length === 1) {
  var asset = environment.findAsset(filenames[0]);

  if (!asset) {
    console.error('Cannot find logical path: ' + filenames[0]);
    process.exit(1);
  }

  process.stdout.write(asset.toString());
  process.exit(0);
}


console.error('Only one file can be compiled to stdout at a time');
process.exit(1);
