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

### Pattern syntax

#### (null-node)

Matches `undefined` node.

#### (return value)

Matches `ReturnStatement`.

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

#### (var name init)

Matches `VariableDeclarator`.

#### (call callee arg0...argn)

Matches `CallExpression`.

`(call fun arg1 arg2)` matches exact amount of arguments,
for arbitrary arguments use
`(call fun . ?)` or similar dotted list syntax.

#### (expression expr)

Matches expression statement, `ExpressionStatement`.

#### (binary op lhs rhs)

Matches `BinaryExpression`.

#### (member object property)

Matches `MemberExpression`.

- (property object property) matches non computed expressions, i.e. `foo.bar`.
- (subscript object property) matches computed expressions i.e. `foo[bar]`.

#### (lookup var.name)

Helper macro for nested variable access.
`(lookup foo.bar.baz)` is equivalent to `(property (property foo bar) baz)`.

#### (throw ex)

Matches `ThrowStatement`.

#### (ternary test con alt)

Matches `ConditionalExpression`.

### match(pattern, node)

Match `node` against `pattern`.
If pattern matches returns an object with match captures.
Otherwise returns `undefined`.

This function is autocurried ie. when one argument is passed, returns function `node -> matchresult`.

This function is also memoized on the pattern, ie each pattern is compiled only once.

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.
Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

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

