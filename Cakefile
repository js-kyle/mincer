#!/bin/env coffee
fs = require 'fs'

Mincer  = require './lib/mincer'

AssetAttributes = require './lib/mincer/asset_attributes'

env = new Mincer.Environment(__dirname + '/test/fixtures')


# provide logger backend
Mincer.logger.use(console);


env.appendPath('app/assets/images')
env.appendPath('app/assets/javascripts')
env.appendPath('app/assets/stylesheets')
env.appendPath('vendor/assets/stylesheets')
env.appendPath('vendor/assets/javascripts')

compile = (asset, callback) ->
  env.findAsset(asset).compile (err, asset) ->
    throw err if err
    #asset.toString() # resulting contents
    #asset.length     # length in bytes
    #asset.mtime      # last modified time
    attrs = new AssetAttributes(env, asset.pathname)
    path =  asset.pathname.replace /((\.\w+))+$/gi, attrs.engineFormatExtension
    fs.writeFile path+".compiled", asset.toString(), (err) ->
      throw err if err
      console.log "Compiled file: #{path}"
      callback?()

task "compile", "compile test files", ->
  files = ['app.css', 'app.js', 'hundreds-of-files/test.js', 'issue-16.js', 'jade-lang.js', 'header.jpg', 'README.md']
  compile(file) for file in files


###
    files =  "application.js.coffee,application.css.less" unless files?.length > 0
    files = files.split(',')
    options.include = options.include.split(',')
    environment.appendPath(include) for include in options.include
    compile(file) for file in files