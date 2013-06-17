// Thin wraper over Object used internally to keep lists of processors.


"use strict";


function ProcessorsMap() {
  this.data = {};
}


// Returns Array of processors registered for given `key`.
//
//    processors.get("text/css").push(DirectiveProcessor);
//
// Associates an empty array with requested key if it doesn't exist yet.
ProcessorsMap.prototype.get = function (key) {
  if (!this.data[key]) {
    this.data[key] = [];
  }

  return this.data[key];
};


// Makes a deep copy of processors collection.
//
//    processors.get("text/css").length;  // => 1
//
//    processors_copy = processors.clone();
//    processors_copy.get("text/css").push(MyMegaProcessor);
//
//    processors.get("text/css").length;      // => 1
//    processors_copy.get("text/css").length; // => 2
//
// Used upon Environment init - clone globally registered processors
ProcessorsMap.prototype.clone = function () {
  var clone = new ProcessorsMap;

  Object.keys(this.data).forEach(function (key) {
    clone.data[key] = this.data[key].slice();
  }, this);

  return clone;
};


module.exports = ProcessorsMap;
