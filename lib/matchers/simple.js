"use strict";

var _ = require("underscore");

function simpleMatcher(rator, statement, prop, expr) {
  /* jshint validthis:true */
  this.assertArguments(rator, 1, arguments, 3);
  expr = expr || "?";

  var exprMatcher = this.matcher(expr);

  return function (node) {
    if (node.type !== statement) { return undefined; }

    return exprMatcher(node[prop]);
  };
}

/**
  #### (return value)

  Matches `ReturnStatement`.
*/
var returnMatcher = _.partial(simpleMatcher, "return", "ReturnStatement", "argument");

/**
  #### (expression expr)

  Matches expression statement, `ExpressionStatement`.
*/
var expressionMatcher = _.partial(simpleMatcher, "expr", "ExpressionStatement", "expression");

/**
  #### (throw ex)

  Matches `ThrowStatement`.
*/
var throwMatcher = _.partial(simpleMatcher, "throw", "ThrowStatement", "argument");

module.exports = {
  "return": returnMatcher,
  "expr": expressionMatcher,
  "throw": throwMatcher,
};