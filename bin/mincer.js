#!/usr/bin/env node

'use strict';


// stdlib
var fs    = require('fs');
var path  = require('path');


// 3rd-party
var ArgumentParser  = require('argparse').ArgumentParser;
var shellwords      = require('shellwords').split;
var watch = require('watch');

// internal
var Mincer      = require('..');


////////////////////////////////////////////////////////////////////////////////


var cli = new ArgumentParser({
  prog:     'mincer',
  version:  require('../package.json').version,
  addHelp:  true
});


cli.addArgument(['--noenv'], {
  help:         'Disables .mincerrc file',
  action:       'storeTrue'
});

cli.addArgument(['-w','--watch'], {
  help:         'Enables watch mode on load paths',
  action:       'storeTrue'
});

cli.addArgument(['-I', '--include'], {
  help:         'Adds the directory to the Mincer load path',
  metavar:      'DIRECTORY',
  action:       'append',
  required:     true
});

cli.addArgument(['-o', '--output'], {
  help:         'Copy provided assets into DIRECTORY',
  metavar:      'DIRECTORY'
});

cli.addArgument(['filenames'], {
  help:         'File(s) to process',
  metavar:      'FILE',
  nargs:        '+'
});

////////////////////////////////////////////////////////////////////////////////

if (-1 === process.argv.indexOf('--noenv')) {
  if (fs.existsSync('.mincerrc')) {
    var rcflags = fs.readFileSync('.mincerrc', 'utf8').replace(/^#.*/gm, '');
    [].splice.apply(process.argv, [2, 0].concat(shellwords(rcflags)));
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

if(args.watch) {
  process.on("uncaughtException", function (err) {
    console.error('Compile ' + err)
  });
}

args.include.forEach(function (path) {
  environment.appendPath(path);

  if(args.watch) {
    watch.createMonitor(
      path,
      {
        ignoreDotFiles:true,
        filter:function(f,stat) {
          //console.log(stat);
        }
      },
      function (monitor) {
        monitor.on("created", function (f, stat) {
          compileManifest();
        })
        monitor.on("changed", function (f, curr, prev) {
          compileManifest();
        })
        monitor.on("removed", function (f, stat) {
          compileManifest();
        })
    });
  }
});

args.filenames.forEach(function (file) {
  filenames.push(path.normalize(file));
});

////////////////////////////////////////////////////////////////////////////////


//
// Configure Mincer logger
//
Mincer.logger.use(console);

if (1 === filenames.length) {
  var compileAsset = function(file) {
    var asset = environment.findAsset(file);

    if (!asset) {
      console.error("Cannot find logical path: " + file);
      process.exit(1);
    }

    asset.compile(function (err) {
      if (err) {
        console.error(err);
        process.exit(1);
      }

      process.stdout.write(asset.toString());
    });
    return;
  }

  compileAsset(filenames[0]);
}

if (args.output) {
  var compileManifest = function() {
    var manifest = new Mincer.Manifest(environment, args.output);
  
    //
    // Compiling manifest with bunch of files
    //
    //console.log(filenames);
    manifest.compile(filenames, function (err) {
      if (err) {
        console.error(err);
        if(!args.watch) {
          process.exit(1);
        }
      }
    });

    manifest = null;
    return;
  }

  compileManifest();
}

if(!args.watch) {
   console.error("Only one file can be compiled to stdout at a time");
   process.exit(1);
}
