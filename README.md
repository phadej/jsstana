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

### Pattern syntax

#### (not pattern)

Matches when `pattern` doesn't match.

#### (or pattern1 pattern2...)

Matches if any pattern matches, returns first match.

#### (and pattern1 pattern2...)

Matches if all pattern matches, returns combinedMatch

#### (call callee arg0...argn)

Matches `CallExpression`.

`(call fun arg1 arg2)` matches exact amount of arguments,
for arbitrary arguments use
`(call fun . ?)` or similar dotted list syntax.

#### (ident name)

Matches `Identifier`.

#### (var name init)

Matches `VariableDeclarator`.

#### (null-node)

Matches `undefined` node.

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

#### (return value)

Matches `ReturnStatement`.

#### (expression expr)

Matches expression statement, `ExpressionStatement`.

#### (throw ex)

Matches `ThrowStatement`.

#### (member object property)

Matches `MemberExpression`.

- (property object property) matches non computed expressions, i.e. `foo.bar`.
- (subscript object property) matches computed expressions i.e. `foo[bar]`.

#### (lookup var.name)

Helper macro for nested variable access.
`(lookup foo.bar.baz)` is equivalent to `(property (property foo bar) baz)`.

The `foo.bar.baz` will work as `(lookup foo.bar.baz)` as well.

#### (binary op lhs rhs)

Matches `BinaryExpression`.

Also shorthand syntax is supported, `(+ a b)` is the same as `(binary + a b)`.

#### (unary op value)

Matches `UnaryExpression`.

Also shorthand version works for `!` and `~`: `(~ ?foo)` is the same as `(unary ~ ?foo)`.

#### (update op value)

Matches `UpdateExpression`.

You might want to use `postfix` and `prefix` though.

#### (assign op var value)

Matches `AssignmentExpression`.

#### (ternary test con alt)

Matches `ConditionalExpression`.

### match(pattern, node)

Match `node` against `pattern`.
If pattern matches returns an object with match captures.
Otherwise returns `undefined`.

This function is autocurried ie. when one argument is passed, returns function `node -> matchresult`.

This function is also memoized on the pattern, ie each pattern is compiled only once.

### createMatcher(pattern, [posMatcher])

Create matcher. With one argument, `matcher(pattern) === match(pattern)`.
With additional arguments, you can add `$0`, `$1`... additional anonymous matchers.

```js
var matcher = jsstana.createMatcher("(expr (= a $0))", function (node) {
  return node.type === "ObjectExpression" && node.properties.length === 0 ? {} : undefined;
});
```

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
