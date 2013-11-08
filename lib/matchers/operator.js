"use strict";

var _ = require("underscore");
var assert = require("assert");

function operatorMatcher(operator, validOperators) {
  if (operator === "?") {
    return function () { return {}; };
  } else if (operator[0] === "?") {
    operator = operator.substr(1);
    return function(op) {
      var res = {};
      res[operator] = op;
      return res;
    };
  } else {
    assert(_.contains(validOperators, operator), operator + " is not valid operator");
    return function (op) {
      return op === operator ? {} : undefined;
    };
  }
}

// http://ecma-international.org/ecma-262/5.1/#sec-7.7
var validBinaryOperators = [
  "+", "-", "*", "/", "%",
  "<<", ">>", ">>>",
  "<", ">", "<=", ">=",
  "==", "!=", "===", "!==",
  "&&", "||",
  "&", "|", "^",
];

var validUnaryOperators = [
  "!", "~", "+", "-",
];

var validUpdateOperators = [
  "++", "--",
];

var validAssignmentOperators = [
  "=",
  "+=", "-=", "*=", "/=", "%=",
  "<<=", ">>=", ">>>=",
  "&=", "|=", "^=",
];

var unaryOperators = _.difference(validUnaryOperators, validBinaryOperators);

// "TODO: , == SequenceExpression"

/**
  #### (binary op lhs rhs)

  Matches `BinaryExpression`.

  Also shorthand syntax is supported, `(+ a b)` is the same as `(binary + a b)`.
*/
function binaryMatcher(operator, lhs, rhs) {
  /* jshint validthis:true */
  var that = this;
  that.assertArguments("binary", 3, arguments);

  operator = operator || "?";
  lhs = lhs || "?";
  rhs = rhs || "?";

  assert(_.isString(operator), "binary operator should be string expr");

  var opMatcher = operatorMatcher(operator, validBinaryOperators);
  var lhsMatcher = that.matcher(lhs);
  var rhsMatcher = that.matcher(rhs);

  return function (node) {
    if (node.type !== "BinaryExpression") { return undefined; }

    var opM = opMatcher(node.operator);
    var lhsM = lhsMatcher(node.left);
    var rhsM = rhsMatcher(node.right);

    return that.combineMatches(opM, lhsM, rhsM);
  };
}

/**
  #### (unary op value)

  Matches `UnaryExpression`.

  Also shorthand version works for `!` and `~`: `(~ ?foo)` is the same as `(unary ~ ?foo)`.
*/
function unaryMatcher(operator, value) {
  /* jshint validthis:true */
  var that = this;
  that.assertArguments("unary", 2, arguments, 1);

  operator = operator || "?";
  value = value || "?";

  assert(_.isString(operator), "unary operator should be string expr");

  var opMatcher = operatorMatcher(operator, validUnaryOperators);
  var valueMatcher = that.matcher(value);

  return function (node) {
    if (node.type !== "UnaryExpression") { return undefined; }

    var opM = opMatcher(node.operator);
    var valueM = valueMatcher(node.argument);

    return that.combineMatches(opM, valueM);
  };
}

/**
  #### (update op value)

  Matches `UpdateExpression`.

  You might want to use `postfix` and `prefix` though.
*/
function updateMatcher(prefix, operator, value) {
  /* jshint validthis:true */
  var that = this;
  that.assertArguments("update/postfix/prefix", 2, arguments, 1);

  operator = operator || "?";
  value = value || "?";

  assert(_.isString(operator), "update operator should be string expr");

  var opMatcher = operatorMatcher(operator, validUpdateOperators);
  var valueMatcher = that.matcher(value);

  return function (node) {
    if (node.type !== "UpdateExpression") { return undefined; }
    if (prefix !== undefined && node.prefix !== prefix) { return undefined; }

    var opM = opMatcher(node.operator);
    var valueM = valueMatcher(node.argument);

    return that.combineMatches(opM, valueM);
  };
}

/**
  #### (assign op var value)

  Matches `AssignmentExpression`.
*/
function assignMatcher(operator, variable, value) {
  /* jshint validthis:true */
  var that = this;
  that.assertArguments("assign", 3, arguments);

  operator = operator || "?";
  variable = variable || "?";
  value = value || "?";

  assert(_.isString(operator), "assignment operator should be string expr");

  var opMatcher = operatorMatcher(operator, validAssignmentOperators);
  var variableMatcher = that.matcher(variable);
  var valueMatcher = that.matcher(value);

  return function (node) {
    if (node.type !== "AssignmentExpression") { return undefined; }

    var opM = opMatcher(node.operator);
    var variableM = variableMatcher(node.left);
    var valueM = valueMatcher(node.right);

    return that.combineMatches(opM, variableM, valueM);
  };
}

exports.binary = binaryMatcher;
exports.unary = unaryMatcher;
exports.update = _.partial(updateMatcher, undefined);
exports.prefix = _.partial(updateMatcher, true);
exports.postfix = _.partial(updateMatcher, false);
exports.assign = assignMatcher;

_.each(validBinaryOperators, function (binop) {
  exports[binop] = _.partial(binaryMatcher, binop);
});

_.each(unaryOperators, function (unop) {
  exports[unop] = _.partial(unaryMatcher, unop);
});

_.each(validAssignmentOperators, function (assignOp) {
  exports[assignOp] = _.partial(assignMatcher, assignOp);
});