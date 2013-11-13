"use strict";

var _ = require("underscore");
var assert = require("assert");

function identifierMatcher(sexpr) {
  assert(_.isString(sexpr), "identifier expression should be a string");

  if (sexpr === "?") {
    return function (node) {
      assert(node.type === "Identifier", "identifier matcher expects identifier nodes");
      return {};
    };
  } else if (sexpr[0] === "?") {
    sexpr = sexpr.substr(1);
    return function (node) {
      assert(node.type === "Identifier", "identifier matcher expects identifier nodes");
      var res = {};
      res[sexpr] = node.name;
      return res;
    };
  } else {
    return function (node) {
      assert(node.type === "Identifier", "identifier matcher expects identifier nodes");
      return node.name === sexpr ? {} : undefined;
    };
  }
}

/**
  #### (ident name)

  Matches `Identifier`.
*/
function identMatcher(name) {
  /* jshint validthis:true */
  var that = this;

  that.assertArguments("ident", 1, arguments);
  name = name || "?";

  var nameMatcher = identifierMatcher(name);

  return function (node) {
    if (node.type !== "Identifier") { return undefined; }

    return nameMatcher(node);
  };
}

/**
  #### (var name init)

  Matches `VariableDeclarator`.
*/
function varMatcher(id, init) {
  /* jshint validthis:true */
  var that = this;

  that.assertArguments("var", 2, arguments);
  id = id || "?";
  init = init || "?";

  var idMatcher = identifierMatcher(id);
  var initMatcher = that.matcher(init);

  return function (node) {
    if (node.type !== "VariableDeclarator") { return undefined; }

    var idM = idMatcher(node.id);
    var initM = initMatcher(node.init);

    return that.combineMatches(idM, initM);
  };
}

module.exports = {
  "var": varMatcher,
  "ident": identMatcher,
};
