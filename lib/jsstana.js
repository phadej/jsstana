/**
  # jsstana

  > s-expression match patterns for [Mozilla Parser AST](https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API)

  [![Build Status](https://secure.travis-ci.org/phadej/jsstana.png?branch=master)](http://travis-ci.org/phadej/jsstana)
  [![NPM version](https://badge.fury.io/js/jsstana.png)](http://badge.fury.io/js/jsstana)
  [![Code Climate](https://codeclimate.com/github/phadej/jsstana.png)](https://codeclimate.com/github/phadej/jsstana)

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
var levenshtein = require("levenshtein");

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

var builtInMatchers = {};
_.extend(builtInMatchers, require("./matchers/logic.js"));
_.extend(builtInMatchers, require("./matchers/literal.js"));
_.extend(builtInMatchers, require("./matchers/operator.js"));
_.extend(builtInMatchers, require("./matchers/simple.js"));
_.extend(builtInMatchers, require("./matchers/call.js"));
_.extend(builtInMatchers, require("./matchers/ident.js"));
_.extend(builtInMatchers, require("./matchers/member.js"));
_.extend(builtInMatchers, require("./matchers/null.js"));
_.extend(builtInMatchers, require("./matchers/ternary.js"));

function unknownNodeType(rator) {
  /* jshint validthis:true */
  var suggest = [];
  function findClose(key) {
      var d = new levenshtein(rator, key).distance;

      if (d <= 2) {
        suggest.push(key);
      }
  }

  _.chain(this.matchers).keys().each(findClose);
  _.chain(builtInMatchers).keys().each(findClose);

  if (suggest.length === 0) {
    throw new Error("unknown node type: " + rator);
  } else {
    throw new Error("unknown node type: " + rator + ". Did you mean one of: " + suggest.join(" "));
  }
}

function matcherString(sexpr) {
  /* jshint validthis:true */
  var that = this;

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

function matcherNumber(sexpr) {
  return function (node) {
    return node.type === "Literal" && node.value === sexpr ? {} : undefined;
  };
}

function matcherArray(sexpr) {
  /* jshint validthis:true */
  var that = this;
  var rator = _.first(sexpr);
  var rands = _.rest(sexpr);

  if (_.has(that.matchers, rator)) {
    return that.matchers[rator].apply(that, rands);
  } else if (_.has(builtInMatchers, rator)) {
    return builtInMatchers[rator].apply(that, rands);
  } else {
    return unknownNodeType.call(that, rator);
  }
}

function matcher(sexpr) {
  /* jshint validthis:true */

  assert(_.isString(sexpr) || _.isNumber(sexpr) || _.isArray(sexpr),
    "expression should be a number, a string or an array -- " + sexpr);

  var that = this instanceof JsstanaContext ? this : new JsstanaContext();
  var args = _.toArray(arguments).slice(1);
  if (args.length !== 0) {
    that = new JsstanaContext(that);
    that.positionalMatchers = args;
  }

  if (_.isString(sexpr)) {
    return matcherString.call(that, sexpr);
  } else if (_.isNumber(sexpr)) {
    return matcherNumber.call(that, sexpr);
  } else /* if (_.isArray(sexpr)) */ {
    return matcherArray.call(that, sexpr);
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

/// include matchers/logic.js
/// include matchers/call.js
/// include matchers/ident.js
/// include matchers/null.js
/// include matchers/literal.js
/// include matchers/simple.js
/// include matchers/member.js
/// include matchers/operator.js
/// include matchers/ternary.js

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
