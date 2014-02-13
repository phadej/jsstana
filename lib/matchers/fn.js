"use strict";

/**
  #### (fn-expr)

  Matches `FunctionExpression`.
*/
function fnExprMatcher() {
  return function (node) {
    return node !== null && node.type === "FunctionExpression" ? {} : undefined;
  };
}

module.exports = {
  "fn-expr": fnExprMatcher,
};
