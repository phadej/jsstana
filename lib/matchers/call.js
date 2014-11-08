"use strict";

var _ = require("underscore");
// var utils = require("../utils.js");

function compileCallMatcher(args) {
  /* jshint validthis:true */

  var len = args.length;

  var multi = false;
  for (var i = 0; i < len; i++) {
    if (typeof args[i] === "string" && args[i].substr(0, 2) === "??") {
      if (multi === false) {
        multi = i;
      } else {
        throw new Error("Only single multi-pattern allowed in (call)");
      }
    }
  }

  var argumentsMatcher;

  if (multi === false) {
    var argumentMatchers = args.map(this.matcher, this);
    argumentsMatcher = function (nodes) {
      var result = {};
      for (var j = 0; j < len; j++) {
        var argumentM = argumentMatchers[j](nodes[j]);
        if (argumentM === undefined) { return undefined; }
        result = _.extend(result, argumentM);
      }
      return result;
    };
  } else {
    var prefixMatchers = args.slice(0, multi).map(this.matcher, this);
    var postfixMatchers = args.slice(multi + 1).map(this.matcher, this);

    var postfixLen = postfixMatchers.length;

    argumentsMatcher = function (nodes) {
      var j;
      var argumentM;
      var result = {};

      for (j = 0; j < multi; j++) {
        argumentM = prefixMatchers[j](nodes[j]);
        if (argumentM === undefined) { return undefined; }
        result = _.extend(result, argumentM);
      }

      var shift = nodes.length - postfixLen;
      if (args[multi] !== "??") {
        var multiVar = args[multi].substr(2);
        result[multiVar] = nodes.slice(multi, shift);
      }

      for (j = 0; j < postfixMatchers.length; j++) {
        argumentM = postfixMatchers[j](nodes[shift + j]);
        if (argumentM === undefined) { return undefined; }
        result = _.extend(result, argumentM);
      }

      return result;
    };
  }

  return {
    argumentsMatcher: argumentsMatcher,
    minArguments: args.length,
    variableArguments: multi !== false,
  };
}

/**
  #### (call callee arg0...argn)

  Matches `CallExpression`.

  `(call fun arg1 arg2)` matches exact amount of arguments,
  for arbitrary arguments use
  `(call fun ??params)`

  #### (new class arg0...argn)

  Matches `NewExpression`.
*/
function callMatcher(callnew, callee) {
  /* jshint validthis:true */
  callee = callee || "?";

  var calleeMatcher = this.matcher(callee);
  var args = _.toArray(arguments).slice(2);

  var compiled = compileCallMatcher.call(this, args);
  var argumentsMatcher = compiled.argumentsMatcher;
  var minArguments = compiled.minArguments;
  var variableArguments = compiled.variableArguments;

  return function (node) {
    if (!node || node.type !== (callnew ? "CallExpression" : "NewExpression")) { return undefined; }

    // Check the length of arguments list
    if (variableArguments) {
      if (node.arguments.length < minArguments) { return undefined; }
    } else {
      if (node.arguments.length !== minArguments) { return undefined; }
    }

    // callee
    var calleeM = calleeMatcher(node.callee);
    if (calleeM === undefined) { return undefined; }

   // arguments
    var argumentsM = argumentsMatcher(node.arguments);
    if (argumentsM === undefined) { return undefined; }

    return _.extend(calleeM, argumentsM);
  };
}

module.exports = {
  "call": _.partial(callMatcher, true),
  "new": _.partial(callMatcher, false),
};
