/**
  # jsstana [![Build Status](https://secure.travis-ci.org/phadej/jsstana.png?branch=master)](http://travis-ci.org/phadej/jsstana)

  s-expression match patterns for [Mozilla Parser AST](https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API)

  ## Synopsis

  ```javascript
  var jsstana = require("jsstana");
  var esprima = require("esprima");

  var contents = // ...
  var syntax = esprima.parse(syntax);

  jsstana.traverse(syntax, function (node) {
      jsstana.traverse(syntax, function (node) {
       var m = jsstana.match("(call alert ?argument)", node);
    if (m) {
      console.log("alert called with argument", m.argument);
    }
  });
  ```

  ## Documentation
 */

"use strict";

var _ = require("underscore");
var p = require("packrattle");
var assert = require("assert");

// Generic traversing function
function traverse(object, visitor) {
  if (visitor.call(null, object) === false) {
    return;
  }

  _.each(object, function (child, key) {
    if (key === "loc" || key === "range" || key === "tokens" || key === "comments") {
      // skip loc and range elements
      return;
    }


    // subelements are either "map" objects or arrays
    if (_.isArray(child)) {
      child.forEach(function (c) {
        traverse(c, visitor);
      });
    } else if (_.isObject(child) && !_.isRegExp(child)) {
      traverse(child, visitor);
    }
  });
}

// S-Expression parser
var whitespaceP = p.regex(/\s*/);

function lexemeP(parser) {
  return p.seq(parser, whitespaceP).onMatch(_.first);
}

var sexprP = p.alt(
  p.seq(lexemeP("("), p.repeat(function () { return sexprP; }), lexemeP(")")).onMatch(function (arr) { return arr[1]; }),
  lexemeP(p.regex(/[a-zA-Z\?\.][a-zA-Z0-9_\?\.]*/)).onMatch(_.first),
  lexemeP(p.regex(/[0-9]+/)).onMatch(function (m) { return parseInt(_.first(m), 10); } )
);

function parseSExpr(input) {
  var parser = p.seq(sexprP, p.end).onMatch(_.last);
  var res = p.consume(parser, input);

  if (res.ok) {
    return res.match;
  } else {
    throw new Error(res.message);
  }
}

// pattern maker

function identifierMatcher(sexpr) {
  assert(_.isString(sexpr), "identifier expression should be a string");

  if (sexpr === "?") {
    return function (node) {
      return node.type === "Identifier" ? {} : undefined;
    };
  } else if (sexpr[0] === "?") {
    sexpr = sexpr.substr(1);
    return function (node) {
      if (node.type === "Identifier") {
        var res = {};
        res[sexpr] = node.name;
        return res;
      }
    };
  } else {
    return function (node) {
      return node.type === "Identifier" && node.name === sexpr ? {} : undefined;
    };
  }
}

function matcher(sexpr) {
  if (_.isString(sexpr)) {
    if (sexpr === "?") {
      return function () {
        return {};
      };
    } else if (sexpr[0] === "?") {
      sexpr = sexpr.substr(1);
      return function (node) {
        var res = {};
        res[sexpr] = node;
        return res;
      };
    } else {
      return function (node) {
        return node.type === "Identifier" && node.name === sexpr ? {} : undefined;
      };
    }
  }

  assert(_.isArray(sexpr), "expression should be an array -- " + sexpr);

  var rator = _.first(sexpr);
  var rands = _.rest(sexpr);

  switch (rator) {
    case "var":
      return varMatcher(rands);
    case "call":
      return callMatcher(rands);
    case "member":
      return memberMatcher(rands);
    case "property":
      return memberMatcher(rands, false);
    case "subscript":
      return memberMatcher(rands, true);
    case "lookup":
      return lookupMatcher(rands);
    case "ternary":
      return ternaryMatcher(rands);
    case "undefined":
      return undefinedMatcher;
    default:
      throw new Error("unknown node type:" + rator);
  }
}

/**
  ### Pattern syntax
*/

/**
  #### (undefined)

  matches `undefined` node
*/
function undefinedMatcher(node) {
  return node === undefined ? {} : undefined;
}

/**
  #### (var name init)

  Matches `VariableDeclarator
*/
function varMatcher(rands) {
  assert(rands.length <= 2, "var takes at most two arguments");
  switch (rands.length) {
    case 0:
      rands = ["?", "?"];
      break;
    case 1:
      rands = [rands[0], "?"];
      break;
    case 2:
      break;
    default:
      throw new Error("var -- takes at most two arguments");
  }

  var idMatcher = identifierMatcher(rands[0]);
  var initMatcher = matcher(rands[1]);

  return function (node) {
    if (node.type !== "VariableDeclarator") { return undefined; }

    var idM = idMatcher(node.id);
    var initM = initMatcher(node.init);

    if (idM !== undefined && initM !== undefined) {
      return _.extend(idM, initM);
    }
  };
}

/**
  #### (call callee arg0...argn)

  Matches `CallExpression`.
*/
function callMatcher(rands) {
  if (rands.length === 0) {
    rands = ["?"];
  }

  var calleeMatcher = matcher(rands[0]);
  var argumentMatchers = rands.slice(1).map(matcher);

  return function (node) {
    if (node.type !== "CallExpression") { return undefined; }

    var calleeM = calleeMatcher(node.callee);
    if (calleeM === undefined) { return undefined; }

    for (var i = 0; i < argumentMatchers.length; i++) {
      var argumentM = argumentMatchers[i](node.arguments[i]);
      if (argumentM === undefined) { return undefined; }

      calleeM = _.extend(calleeM, argumentM);
    }

    return calleeM;
  };
}

/**
  #### (member object property)

  Matches `MemberExpression`.

  #### (property object property)

  Matches non computed `MemberExpression` i.e. `foo.bar`.

  #### (subscript object property)

  Matches computed `MemberExpression` i.e. `foo[bar]`.
*/
function memberMatcher(rands, computed) {
  switch (rands.length) {
    case 0:
      rands = ["?", "?"];
      break;
    case 1:
      rands = [rands[0], "?"];
      break;
    case 2:
      break;
    default:
      throw new Error("member/property/subscript -- takes at most two arguments");
  }

  var objectMatcher = matcher(rands[0]);
  var propertyMatcher = matcher(rands[1]);

  return function (node) {
    if (node.type !== "MemberExpression") { return undefined; }
    if (computed !== undefined && node.computed !== computed) { return undefined; }

    var objectM = objectMatcher(node.object);
    var propertyM = propertyMatcher(node.property);

    if (objectM !== undefined && propertyM !== undefined) {
      return _.extend(objectM, propertyM);
    }
  };
}

/**
  #### (lookup var.name)

  Helper macro for nested variable access.
  `(lookup foo.bar.baz)` is equivalent to `(property (property foo bar) baz)`.
*/
function lookupMatcher(rands) {
  assert(rands.length === 1 && _.isString(rands[0]), "lookup -- takes one string argument");

  // split into parts and build an s-expression
  var parts = rands[0].split(".");
  var sexpr = parts.reduce(function (prev, next) {
    return ["property", prev, next];
  });

  return matcher(sexpr);
}

/**
  #### (ternary test con alt)

  Matches `ConditionalExpression`.
*/
function ternaryMatcher(rands) {
  switch (rands.length) {
    case 0:
      rands = ["?", "?", "?"];
      break;
    case 1:
      rands = [rands[0], "?", "?"];
      break;
    case 2:
      rands = [rands[0], rands[1], "?"];
      break;
    case 3:
      break;
    default:
      throw new Error("ternary-- takes at most three arguments");
  }

  var testMatcher = matcher(rands[0]);
  var consequentMatcher = matcher(rands[1]);
  var alternateMatcher = matcher(rands[2]);

  return function (node) {
    if (node.type !== "ConditionalExpression") { return undefined; }

    var testM = testMatcher(node.test);
    var consequentM = consequentMatcher(node.consequent);
    var alternateM = alternateMatcher(node.alternate);

    if (testM !== undefined && consequentM !== undefined && alternateM !== undefined) {
      return _.extend(testM, consequentM, alternateM);
    }
  };
}

// memoized patterns
var matchPatterns = {};

/**
    ### match(pattern, node)

    Match `node` against `pattern`.
    If pattern matches returns an object with match captures.
    Otherwise returns `undefined`.

    This function is autocurried ie. when one argument is passed, returns function `node -> matchresult`.

    This function is also memoized on the pattern, ie each pattern is compiled only once.
*/
function match(pattern, node) {
  assert(arguments.length === 1 || arguments.length === 2, "match takes one or two arguments");

  if (!_.has(matchPatterns, pattern)) {
    matchPatterns[pattern] = matcher(parseSExpr(pattern));
  }

  var m = matchPatterns[pattern];

  if (arguments.length === 1) {
    return m;
  } else {
    return m(node);
  }
}

// Exports
exports.traverse = traverse;
exports.parseSExpr = parseSExpr;
exports.match = match;

/**

  ## Contributing

  In lieu of a formal styleguide, take care to maintain the existing coding style.
  Add unit tests for any new or changed functionality.
  Lint and test your code using [Grunt](http://gruntjs.com/).

  ## Release History

  - 0.0.1 Preview release

  ## License

  Copyright (c) 2013 Oleg Grenrus.
  Licensed under the BSD3 license.
*/