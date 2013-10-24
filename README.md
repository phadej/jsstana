
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

### Pattern syntax

#### (undefined)

matches `undefined` node

#### (var name init)

Matches `VariableDeclarator

#### (call callee arg0...argn)

Matches `CallExpression`.

#### (member object property)

Matches `MemberExpression`.

#### (property object property)

Matches non computed `MemberExpression` i.e. `foo.bar`.

#### (subscript object property)

Matches computed `MemberExpression` i.e. `foo[bar]`.

#### (lookup var.name)

Helper macro for nested variable access.
`(lookup foo.bar.baz)` is equivalent to `(property (property foo bar) baz)`.

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

- 0.0.1 Preview release

## License

Copyright (c) 2013 Oleg Grenrus.
Licensed under the BSD3 license.
