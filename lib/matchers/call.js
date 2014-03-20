"use strict";

var _ = require("underscore");

function compileCallMatcher(args) {
  /* jshint validthis:true */

  var dotted = false;
  var dottedM;

  if (args.length > 1 && args[args.length - 2] === ".") {
    dotted = args[args.length - 1];
    args = args.slice(0, -2);

    if (dotted === "?") {
      dottedM = function () {
        return {};
      };
    } else if (dotted[0] === "?") {
      dotted = dotted.substr(1);
      dottedM = function(v) {
        var res = {};
        res[dotted] = v;
        return res;
      };
    } else {
      throw new Error("call should have pattern variable after dot");
    }
  }

  var argumentMatchers = args.map(this.matcher, this);

  return {
    dottedMatcher: dottedM,
    argumentMatchers: argumentMatchers,
  };
}

/**
  #### (call callee arg0...argn)

  Matches `CallExpression`.

  `(call fun arg1 arg2)` matches exact amount of arguments,
  for arbitrary arguments use
  `(call fun . ?)` or similar dotted list syntax.

  #### (new class arg0...argn)

  Matches `NewExpression`.
*/
function callMatcher(callnew, callee) {
  /* jshint validthis:true */
  callee = callee || "?";

  var calleeMatcher = this.matcher(callee);
  var args = _.toArray(arguments).slice(2);

  var compiled = compileCallMatcher.call(this, args);
  var dottedM = compiled.dottedMatcher;
  var argumentMatchers = compiled.argumentMatchers;

  return function (node) {
    if (!node || node.type !== (callnew ? "CallExpression" : "NewExpression")) { return undefined; }

    var calleeM = calleeMatcher(node.callee);
    if (calleeM === undefined) { return undefined; }
    if (!dottedM && argumentMatchers.length !== node.arguments.length) { return undefined; }

    for (var i = 0; i < argumentMatchers.length; i++) {
      var argumentM = argumentMatchers[i](node.arguments[i]);
      if (argumentM === undefined) { return undefined; }

      calleeM = _.extend(calleeM, argumentM);
    }

    if (dottedM) {
      calleeM = _.extend(calleeM, dottedM(node.arguments.slice(argumentMatchers.length)));
    }

    return calleeM;
  };
}

module.exports = {
  "call": _.partial(callMatcher, true),
  "new": _.partial(callMatcher, false),
};
