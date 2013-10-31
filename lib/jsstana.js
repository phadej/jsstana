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

  ## jsgrep

  The jsgrep example utility is provided

  ```bash
  # find assertArguments calls with 4 arguments
  % jsgrep '(call assertArguments ? ? ? ?)' lib
  jsstana.js:224:   assertArguments("true/false/null/infinity/nan/undefined", 0, arguments, 1);
  jsstana.js:255:   assertArguments("literal", 1, arguments, 1);
  jsstana.js:485:   assertArguments("member/property/subscript", 2, arguments, 1);
  ```

  ## Documentation
 */

"use strict";

var _ = require("underscore");
var assert = require("assert");
var sexpr = require("./sexpr.js");

// Generic traversing function
function traverse(object, visitor) {
  if (visitor.call(null, object) === false) {
    return;
  }

  _.each(object, function (child, key) {
    if (key === "loc" || key === "range") {
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
    } else if (sexpr === "true") {
      return function (node) {
        return node.type === "Literal" && node.value === true ? {} : undefined;
      };
    } else if (sexpr === "false") {
      return function (node) {
        return node.type === "Literal" && node.value === false ? {} : undefined;
      };
    } else if (sexpr === "null") {
      return function (node) {
        return node.type === "Literal" && node.value === null ? {} : undefined;
      };
    } else {
      return function (node) {
        return node.type === "Identifier" && node.name === sexpr ? {} : undefined;
      };
    }
  }

  if (_.isNumber(sexpr)) {
    return function (node) {
      return node.type === "Literal" && node.value === sexpr ? {} : undefined;
    };
  }

  assert(_.isArray(sexpr), "expression should be an array -- " + sexpr);

  var rator = _.first(sexpr);
  var rands = _.rest(sexpr);

  var matchers = {
    "var": varMatcher,
    "return": returnMatcher,
    "call": callMatcher.bind(undefined, true),
    "new": callMatcher.bind(undefined, false),
    "expr": expressionMatcher,
    "binary": binaryMatcher,
    "member": memberMatcher.bind(undefined, undefined),
    "property": memberMatcher.bind(undefined, false),
    "subscript": memberMatcher.bind(undefined, true),
    "lookup": lookupMatcher,
    "throw": throwMatcher,
    "ternary": ternaryMatcher,
    "literal": literalMatcher.bind(undefined, "any"),
    "literal-string": literalMatcher.bind(undefined, "string"),
    "literal-number": literalMatcher.bind(undefined, "number"),
    "literal-bool": literalMatcher.bind(undefined, "bool"),
    "literal-regexp": literalMatcher.bind(undefined, "regexp"),
    "null": literalBuiltinMatcher.bind(undefined, "null"),
    "true": literalBuiltinMatcher.bind(undefined, "true"),
    "false": literalBuiltinMatcher.bind(undefined, "false"),
    "infinity": literalBuiltinMatcher.bind(undefined, "infinity"),
    "nan": literalBuiltinMatcher.bind(undefined, "nan"),
    "undefined": literalBuiltinMatcher.bind(undefined, "undefined"),
    "null-node": nullNodeMatcher,
  };

  if (_.has(matchers, rator)) {
    return matchers[rator].apply(undefined, rands);
  } else {
    throw new Error("unknown node type: " + rator);
  }
}

function assertArguments(rator, n, rands, m) {
  m = m || 0;
  assert(rands.length <= n + m, rator + " -- takes at most " + n + " argument(s)");
}

/**
  ### Pattern syntax
*/

/**
  #### (null-node)

  Matches `undefined` node.
*/
function nullNodeMatcher() {
  assertArguments("null-node", 0, arguments);
  return function (node) {
    return node === null ? {} : undefined;
  };
}

/**
  #### (return value)

  Matches `ReturnStatement`.
*/
function returnMatcher(value) {
  assertArguments("return", 1, arguments);
  value = value || "?";

  var valueMatcher = matcher(value);

  return function (node) {
    if (node.type !== "ReturnStatement") { return undefined; }

    var valueM = valueMatcher(node.argument);

    return valueM;
  };
}

/**
  #### (literal value)

  Matches `Literal`.

  There are some additional version:
  - `(literal-string value)` - string values
  - `(literal-number value)` - number values
  - `(literal-bool value)` - boolean values
  - `(literal-regexp value)` - regular expressions
  - `(true)` - matches `true`
  - `(false)` - matches `false`
  - `(null)` - matches `null`
  - `(infinity)` - matches `Infinity`
  - `(nan)` - matches `NaN`
  - `(undefined)` - matches `undefined`
*/

function literalBuiltinMatcher(type) {
  assertArguments("true/false/null/infinity/nan/undefined", 0, arguments, 1);

  // Constants
  if (type === "true") {
    return function (node) {
      return node.type === "Literal" && node.value === true ? {} : undefined;
    };
  } else if (type === "false") {
    return function (node) {
      return node.type === "Literal" && node.value === false ? {} : undefined;
    };
  } else if (type === "null") {
    return function (node) {
      return node.type === "Literal" && node.value === null ? {} : undefined;
    };
  } else if (type === "infinity") {
    return function (node) {
      return node.type === "Identifier" && node.name === "Infinity" ? {} : undefined;
    };
  } else if (type === "nan") {
    return function (node) {
      return node.type === "Identifier" && node.name === "NaN" ? {} : undefined;
    };
  } else if (type === "undefined") {
    return function (node) {
      return node.type === "Identifier" && node.name === "undefined" ? {} : undefined;
    };
  }
}

function literalMatcher(type, value) {
  assertArguments("literal", 1, arguments, 1);

  value = value || "?";

  if (value[0] === "?") {
    var valueCheck = {
      any: function () { return true; },
      string: _.isString,
      number: _.isNumber,
      regexp: _.isRegExp,
      bool: _.isBoolean,
    }[type];

    var valueCapture;

    if (value === "?") {
      valueCapture = function() { return {}; };
    } else {
      value = value.substr(1);
      valueCapture = function(v) {
        var res = {};
        res[value] = v;
        return res;
      };
    }

    return function (node) {
      if (node.type !== "Literal") { return undefined; }
      if (!valueCheck(node.value)) { return undefined; }
      return valueCapture(node.value);
    };
  } else {
    if (type === "regexp") {
      return function (node) {
        if (node.type !== "Literal") { return undefined; }
        if (!_.isRegExp(node.value)) { return undefined; }
        return node.value.toString() === value ? {} : undefined;
      };
    } else {
      value = {
        any: _.identity,
        string: _.identity,
        number: function (v) {
          v = parseFloat(v);
          if (isNaN(v)) {
            // TODO: improve check, regexp?
            throw new Error("invalid number value");
          } else {
            return v;
          }
        },
        bool: function (v) {
          if (v === "true") {
            return true;
          } else if (v === "false") {
            return false;
          } else {
            throw new Error("bool values are true and false");
          }
        }
      }[type](value);

      return function (node) {
        if (node.type !== "Literal") { return undefined; }
        return node.value === value ? {} : undefined;
      };
    }
  }

}

/**
  #### (var name init)

  Matches `VariableDeclarator`.
*/
function varMatcher(id, init) {
  assertArguments("var", 2, arguments);
  id = id || "?";
  init = init || "?";

  var idMatcher = identifierMatcher(id);
  var initMatcher = matcher(init);

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

  `(call fun arg1 arg2)` matches exact amount of arguments,
  for arbitrary arguments use
  `(call fun . ?)` or similar dotted list syntax.
*/
function callMatcher(callnew, callee) {
  callee = callee || "?";

  var calleeMatcher = matcher(callee);
  var args = _.toArray(arguments).slice(2);
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

  var argumentMatchers = args.map(matcher);

  return function (node) {
    if (node.type !== (callnew ? "CallExpression" : "NewExpression")) { return undefined; }

    var calleeM = calleeMatcher(node.callee);
    if (calleeM === undefined) { return undefined; }
    if (!dotted && argumentMatchers.length !== node.arguments.length) { return undefined; }

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

/**
  #### (expression expr)

  Matches expression statement, `ExpressionStatement`.
*/
function expressionMatcher(expr) {
  assertArguments("expr", 1, arguments);
  expr = expr || "?";

  var exprMatcher = matcher(expr);

  return function (node) {
    if (node.type !== "ExpressionStatement") { return undefined; }

    return exprMatcher(node.expression);
  };
}

/**
  #### (binary op lhs rhs)

  Matches `BinaryExpression`.
*/
function binaryMatcher(operator, lhs, rhs) {
  assertArguments("binary", 3, arguments);

  operator = operator || "?";
  lhs = lhs || "?";
  rhs = rhs || "?";

  assert(_.isString(operator), "binary operator should be string expr");

  var operatorMatcher;
  if (operator === "?") {
    operatorMatcher = function () { return {}; };
  } else if (operator[0] === "?") {
    operator = operator.substr(1);
    operatorMatcher = function(op) {
      var res = {};
      res[operator] = op;
      return res;
    };
  } else {
    operatorMatcher = function (op) {
      return op === operator ? {} : undefined;
    };
  }

  var lhsMatcher = matcher(lhs);
  var rhsMatcher = matcher(rhs);

  return function (node) {
    if (node.type !== "BinaryExpression") { return undefined; }

    var operatorM = operatorMatcher(node.operator);
    var lhsM = lhsMatcher(node.left);
    var rhsM = rhsMatcher(node.right);

    if (operatorM !== undefined && lhsM !== undefined && rhsM !== undefined) {
      return _.extend(operatorM, lhsM, rhsM);
    }
  };
}

/**
  #### (member object property)

  Matches `MemberExpression`.

  - (property object property) matches non computed expressions, i.e. `foo.bar`.
  - (subscript object property) matches computed expressions i.e. `foo[bar]`.
*/
function memberMatcher(computed, object, property) {
  assertArguments("member/property/subscript", 2, arguments, 1);
  object = object || "?";
  property = property || "?";

  var objectMatcher = matcher(object);
  var propertyMatcher = matcher(property);

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
function lookupMatcher(varname) {
  assert(_.isString(varname), "lookup -- takes one string argument");

  // split into parts and build an s-expression
  var parts = varname.split(".");
  var sexpr = parts.reduce(function (prev, next) {
    return ["property", prev, next];
  });

  return matcher(sexpr);
}

/**
  #### (throw ex)

  Matches `ThrowStatement`.
*/
function throwMatcher(ex) {
  assertArguments("throw", 1, arguments);
  ex = ex || "?";

  var exMatcher = matcher(ex);

  return function (node) {
    if (node.type !== "ThrowStatement") { return undefined; }

    return exMatcher(node.argument);
  };
}

/**
  #### (ternary test con alt)

  Matches `ConditionalExpression`.
*/
function ternaryMatcher(test, con, alt) {
  assertArguments("ternary", 3, arguments);
  test = test || "?";
  con = con || "?";
  alt = alt || "?";

  var testMatcher = matcher(test);
  var consequentMatcher = matcher(con);
  var alternateMatcher = matcher(alt);

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
    matchPatterns[pattern] = matcher(sexpr.parse(pattern));
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
exports.parseSExpr = sexpr.parse;
exports.match = match;

/**

  ## Contributing

  In lieu of a formal styleguide, take care to maintain the existing coding style.
  Add unit tests for any new or changed functionality.
  Lint and test your code using [Grunt](http://gruntjs.com/).

  ## Release History

  - 0.0.5 jsgrep
    - also new expression
  - 0.0.4 Binary and throw
  - 0.0.3 More rands
    - call dotted syntax
    - literals
    - expr - expression statement
    - use grunt-literate to generate README.md
  - 0.0.2 Dev setup
  - 0.0.1 Preview release

  ## License

  Copyright (c) 2013 Oleg Grenrus.
  Licensed under the BSD3 license.
*/
