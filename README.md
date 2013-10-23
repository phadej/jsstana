# jsstana [![Build Status](https://secure.travis-ci.org/phadej/jsstana.png?branch=master)](http://travis-ci.org/phadej/jsstana)

s-expression match patterns for Mozilla Parser AST

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

_(Coming soon)_


## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History

- 0.0.1 Preview release

## License
Copyright (c) 2013 Oleg Grenrus  
Licensed under the BSD3 license.
