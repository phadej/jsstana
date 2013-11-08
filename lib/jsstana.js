/**
  # jsstana [![Build Status](https://secure.travis-ci.org/phadej/jsstana.png?branch=master)](http://travis-ci.org/phadej/jsstana)

  s-expression match patterns for [Mozilla Parser AST](https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API)

  ## Synopsis

  ```javascript
  var jsstana = require("jsstana");
  var esprima = require("esprima");

  var contents = // ...
  var syntax = esprima.parse(contents);

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

var builtInMatchers = {
  "not": notMatcher,
  "or": orMatcher,
  "and": andMatcher,
  "var": varMatcher,
  "ident": identMatcher,
  "return": returnMatcher,
  "call": _.partial(callMatcher, true),
  "new": _.partial(callMatcher, false),
  "expr": expressionMatcher,
  "binary": binaryMatcher,
  "unary": unaryMatcher,
  "update": _.partial(updateMatcher, undefined),
  "prefix": _.partial(updateMatcher, true),
  "postfix": _.partial(updateMatcher, false),
  "assign": assignMatcher,
  "member": _.partial(memberMatcher, undefined),
  "property": _.partial(memberMatcher, false),
  "subscript": _.partial(memberMatcher, true),
  "lookup": lookupMatcher,
  "throw": throwMatcher,
  "ternary": ternaryMatcher,
  "literal": _.partial(literalMatcher, "any"),
  "string": _.partial(literalMatcher, "string"),
  "number": _.partial(literalMatcher, "number"),
  "bool": _.partial(literalMatcher, "bool"),
  "regexp": _.partial(literalMatcher, "regexp"),
  "null": _.partial(literalBuiltinMatcher, "null"),
  "true": _.partial(literalBuiltinMatcher, "true"),
  "false": _.partial(literalBuiltinMatcher, "false"),
  "infinity": _.partial(literalBuiltinMatcher, "infinity"),
  "nan": _.partial(literalBuiltinMatcher, "nan"),
  "undefined": _.partial(literalBuiltinMatcher, "undefined"),
  "null-node": nullNodeMatcher,
};

var unaryOperators = _.difference(validUnaryOperators, validBinaryOperators);

// "TODO: , == SequenceExpression"

_.each(validBinaryOperators, function (binop) {
  builtInMatchers[binop] = _.partial(binaryMatcher, binop);
});

_.each(unaryOperators, function (unop) {
  builtInMatchers[unop] = _.partial(unaryMatcher, unop);
});

_.each(validAssignmentOperators, function (assignOp) {
  builtInMatchers[assignOp] = _.partial(assignMatcher, assignOp);
});

function matcher(sexpr) {
  /* jshint validthis:true */
  var that = this instanceof JsstanaContext ? this : new JsstanaContext();
  var args = _.toArray(arguments).slice(1);
  if (args.length !== 0) {
    that = new JsstanaContext(that);
    that.positionalMatchers = args;
  }

  if (_.isString(sexpr)) {
    if (sexpr.indexOf(".") !== -1) {
      sexpr = sexpr.split(".").reduce(function (prev, next) {
        return ["property", prev, next];
      });
      return that.matcher(sexpr);
    } else if (sexpr === "?") {
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
    } else if (sexpr.match(/^\$\d+$/)) {
      sexpr = parseInt(sexpr.substr(1), 10);
      assert(sexpr < that.positionalMatchers.length,
        "there is only " + that.positionalMatchers.length + " positional matchers, required " + sexpr);
      return that.positionalMatchers[sexpr];
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

  assert(_.isArray(sexpr), "expression should be a number, a string or an array -- " + sexpr);

  var rator = _.first(sexpr);
  var rands = _.rest(sexpr);

  if (_.has(that.matchers, rator)) {
    return that.matchers[rator].apply(that, rands);
  } else if (_.has(builtInMatchers, rator)) {
    return builtInMatchers[rator].apply(that, rands);
  } else {
    throw new Error("unknown node type: " + rator);
  }
}

function assertArguments(rator, n, rands, m) {
  m = m || 0;
  assert(rands.length <= n + m, rator + " -- takes at most " + n + " argument(s)");
}

function combineMatches() {
  var args = _.toArray(arguments);
  if (args.some(_.isUndefined)) { return undefined; }
  return _.extend.apply(undefined, args);
}

/**
  ### Pattern syntax
*/

/**
  #### (not pattern)

  Matches when `pattern` doesn't match.
*/
function notMatcher(pattern) {
  /* jshint validthis:true */
  assertArguments("not", 1, arguments);
  pattern = pattern || "?";

  var patternMatcher = this.matcher(pattern);

  return function (node) {
    return patternMatcher(node) ? undefined : {};
  };
}

/**
  #### (or pattern1 pattern2...)

  Matches if any pattern matches, returns first match.
*/
function orMatcher() {
  /* jshint validthis:true */
  var args = _.toArray(arguments);
  var argsMatchers = args.map(matcher, this);

  return function (node) {
    for (var i = 0; i < argsMatchers.length; i++) {
      var m = argsMatchers[i](node);
      if (m) {
        return m;
      }
    }

    return undefined;
  };
}

/**
  #### (and pattern1 pattern2...)

  Matches if all pattern matches, returns combinedMatch
*/
function andMatcher() {
  /* jshint validthis:true */
  var args = _.toArray(arguments);
  var argsMatchers = args.map(matcher, this);

  return function (node) {
    var res = {};

    for (var i = 0; i < argsMatchers.length; i++) {
      var m = argsMatchers[i](node);
      if (m === undefined) {
        return undefined;
      }

      res = _.extend(res, m);
    }

    return res;
  };
}

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
  /* jshint validthis:true */
  assertArguments("return", 1, arguments);
  value = value || "?";

  var valueMatcher = this.matcher(value);

  return function (node) {
    if (node.type !== "ReturnStatement") { return undefined; }

    return valueMatcher(node.argument);
  };
}

/**
  #### (literal value)

  Matches `Literal`.

  There are some additional version:
  - `(string value)` - string values
  - `(number value)` - number values
  - `(bool value)` - boolean values
  - `(regexp value)` - regular expressions
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
  } else /* if (type === "undefined") */ {
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
  /* jshint validthis:true */
  assertArguments("var", 2, arguments);
  id = id || "?";
  init = init || "?";

  var idMatcher = identifierMatcher(id);
  var initMatcher = this.matcher(init);

  return function (node) {
    if (node.type !== "VariableDeclarator") { return undefined; }

    var idM = idMatcher(node.id);
    var initM = initMatcher(node.init);

    return combineMatches(idM, initM);
  };
}

/**
  #### (ident name)

  Matches `Identifier`.
*/
function identMatcher(name) {
  assertArguments("ident", 1, arguments);
  name = name || "?";

  var nameMatcher = identifierMatcher(name);

  return function (node) {
    if (node.type !== "Identifier") { return undefined; }

    return nameMatcher(node);
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
  /* jshint validthis:true */
  callee = callee || "?";

  var calleeMatcher = this.matcher(callee);
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

  var argumentMatchers = args.map(matcher, this);

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
  /* jshint validthis:true */
  assertArguments("expr", 1, arguments);
  expr = expr || "?";

  var exprMatcher = this.matcher(expr);

  return function (node) {
    if (node.type !== "ExpressionStatement") { return undefined; }

    return exprMatcher(node.expression);
  };
}

/**
  #### (binary op lhs rhs)

  Matches `BinaryExpression`.

  Also shorthand syntax is supported, `(+ a b)` is the same as `(binary + a b)`.
*/
function binaryMatcher(operator, lhs, rhs) {
  /* jshint validthis:true */
  assertArguments("binary", 3, arguments);

  operator = operator || "?";
  lhs = lhs || "?";
  rhs = rhs || "?";

  assert(_.isString(operator), "binary operator should be string expr");

  var opMatcher = operatorMatcher(operator, validBinaryOperators);
  var lhsMatcher = this.matcher(lhs);
  var rhsMatcher = this.matcher(rhs);

  return function (node) {
    if (node.type !== "BinaryExpression") { return undefined; }

    var opM = opMatcher(node.operator);
    var lhsM = lhsMatcher(node.left);
    var rhsM = rhsMatcher(node.right);

    return combineMatches(opM, lhsM, rhsM);
  };
}

/**
  #### (unary op value)

  Matches `UnaryExpression`.

  Also shorthand version works for `!` and `~`: `(~ ?foo)` is the same as `(unary ~ ?foo)`.
*/
function unaryMatcher(operator, value) {
  /* jshint validthis:true */
  assertArguments("unary", 2, arguments, 1);

  operator = operator || "?";
  value = value || "?";

  assert(_.isString(operator), "unary operator should be string expr");

  var opMatcher = operatorMatcher(operator, validUnaryOperators);
  var valueMatcher = this.matcher(value);

  return function (node) {
    if (node.type !== "UnaryExpression") { return undefined; }

    var opM = opMatcher(node.operator);
    var valueM = valueMatcher(node.argument);

    return combineMatches(opM, valueM);
  };
}

/**
  #### (update op value)

  Matches `UpdateExpression`.

  You might want to use `postfix` and `prefix` though.
*/
function updateMatcher(prefix, operator, value) {
  /* jshint validthis:true */
  assertArguments("update/postfix/prefix", 2, arguments, 1);

  operator = operator || "?";
  value = value || "?";

  assert(_.isString(operator), "update operator should be string expr");

  var opMatcher = operatorMatcher(operator, validUpdateOperators);
  var valueMatcher = this.matcher(value);

  return function (node) {
    if (node.type !== "UpdateExpression") { return undefined; }
    if (prefix !== undefined && node.prefix !== prefix) { return undefined; }

    var opM = opMatcher(node.operator);
    var valueM = valueMatcher(node.argument);

    return combineMatches(opM, valueM);
  };
}

/**
  #### (assign op var value)

  Matches `AssignmentExpression`.
*/
function assignMatcher(operator, variable, value) {
  /* jshint validthis:true */
  assertArguments("assign", 3, arguments);

  operator = operator || "?";
  variable = variable || "?";
  value = value || "?";

  assert(_.isString(operator), "assignment operator should be string expr");

  var opMatcher = operatorMatcher(operator, validAssignmentOperators);
  var variableMatcher = this.matcher(variable);
  var valueMatcher = this.matcher(value);

  return function (node) {
    if (node.type !== "AssignmentExpression") { return undefined; }

    var opM = opMatcher(node.operator);
    var variableM = variableMatcher(node.left);
    var valueM = valueMatcher(node.right);

    return combineMatches(opM, variableM, valueM);
  };
}
/**
  #### (member object property)

  Matches `MemberExpression`.

  - (property object property) matches non computed expressions, i.e. `foo.bar`.
  - (subscript object property) matches computed expressions i.e. `foo[bar]`.
*/
function memberMatcher(computed, object, property) {
  /* jshint validthis:true */
  assertArguments("member/property/subscript", 2, arguments, 1);
  object = object || "?";
  property = property || "?";

  var objectMatcher = matcher(object);
  var propertyMatcher = this.matcher(property);

  return function (node) {
    if (node.type !== "MemberExpression") { return undefined; }
    if (computed !== undefined && node.computed !== computed) { return undefined; }

    var objectM = objectMatcher(node.object);
    var propertyM = propertyMatcher(node.property);

    return combineMatches(objectM, propertyM);
  };
}

/**
  #### (lookup var.name)

  Helper macro for nested variable access.
  `(lookup foo.bar.baz)` is equivalent to `(property (property foo bar) baz)`.

  The `foo.bar.baz` will work as `(lookup foo.bar.baz)` as well.
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
  /* jshint validthis:true */
  assertArguments("throw", 1, arguments);
  ex = ex || "?";

  var exMatcher = this.matcher(ex);

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
  /* jshint validthis:true */
  assertArguments("ternary", 3, arguments);
  test = test || "?";
  con = con || "?";
  alt = alt || "?";

  var testMatcher = this.matcher(test);
  var consequentMatcher = this.matcher(con);
  var alternateMatcher = this.matcher(alt);

  return function (node) {
    if (node.type !== "ConditionalExpression") { return undefined; }

    var testM = testMatcher(node.test);
    var consequentM = consequentMatcher(node.consequent);
    var alternateM = alternateMatcher(node.alternate);

    return combineMatches(testM, consequentM, alternateM);
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
  /* jshint validthis:true */
  assert(arguments.length === 1 || arguments.length === 2, "match takes one or two arguments");
  var that = this instanceof JsstanaContext ? this : new JsstanaContext();

  if (!_.has(matchPatterns, pattern)) {
    matchPatterns[pattern] = that.matcher(sexpr.parse(pattern));
  }

  var m = matchPatterns[pattern];

  if (arguments.length === 1) {
    return m;
  } else {
    return m(node);
  }
}

/**
    ### createMatcher(pattern, [posMatcher])

    Create matcher. With one argument, `matcher(pattern) === match(pattern)`.
    With additional arguments, you can add `$0`, `$1`... additional anonymous matchers.

    ```js
    var matcher = jsstana.createMatcher("(expr (= a $0))", function (node) {
      return node.type === "ObjectExpression" && node.properties.length === 0 ? {} : undefined;
    });
    ```
*/
function createMatcher() {
  /* jshint validthis:true */
  var args = _.toArray(arguments);
  args[0] = sexpr.parse(args[0]);
  return matcher.apply(this, args);
}

/**
  ### new jsstana()

  Create new jsstana context. You can add new operations to this one.

  ```js
  var ctx = new jsstana();
  ctx.addMatchers("empty-object", function () {
    this.assertArguments("empty-object", 0, arguments);
    return function (node) {
      return node.type === "ObjectExpression" && node.properties.length === 0 ? {} : undefined;
    };
  });
  ctx.match("(empty-object", node);
  ```
  
  You may compile submatchers with `this.matcher(sexpr)` and combine their results with `this.combineMatches`.
  `this.assertArguments` checks argument (rator) count, to help validate pattern grammar.
*/
function JsstanaContext(context) {
  this.matchers = context instanceof JsstanaContext ? context.matchers : {};
  this.positionalMatchers = [];
}

// matcher utilities
JsstanaContext.prototype.combineMatches = combineMatches;
JsstanaContext.prototype.assertArguments = assertArguments;
JsstanaContext.prototype.matcher = matcher;

// public api
JsstanaContext.prototype.match = match;
JsstanaContext.prototype.createMatcher = createMatcher;
JsstanaContext.prototype.addMatcher = function (name, f) {
  assert(!_.has(this.matchers, name), "matcher names should be unique: " + name);
  this.matchers[name] = f;
};

// Exports
JsstanaContext.traverse = traverse;
JsstanaContext.match = match;
JsstanaContext.createMatcher = createMatcher;

module.exports = JsstanaContext;

/**

  ## Contributing

  In lieu of a formal styleguide, take care to maintain the existing coding style.
  Add unit tests for any new or changed functionality.
  Lint and test your code using [Grunt](http://gruntjs.com/).

  Use `grunt mochacov` to generate coverage report with blanket,
  or `istanbul cover grunt simplemocha` to do coverage with istanbul.

  ## Release History

  - 0.0.11 User-provided patterns
    - fixed installing on Windows
    - assignment pattern
    - anonymous matchers
  - 0.0.10 ident pattern
  - 0.0.9 Boolean patterns
  - 0.0.8 Even more rands
    - unary and update expressions
    - drop `literal-` prefix (eg plain `string` now)
    - shorthand binary op syntax `(+ a b)`
    - shorthand lookup syntax
  - 0.0.7 jsgrep, third try
  - 0.0.6 jsgrep, second try
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
