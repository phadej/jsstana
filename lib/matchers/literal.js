"use strict";

var _ = require("underscore");

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
  /* jshint validthis:true */
  this.assertArguments("true/false/null/infinity/nan/undefined", 0, arguments, 1);

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

function literalCaptureMatcher(type, value) {
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
}

function literalValue(type, value) {
  return {
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
}

function literalMatcher(type, value) {
  /* jshint validthis:true */
  this.assertArguments("literal", 1, arguments, 1);

  value = value || "?";

  if (value[0] === "?") {
    return literalCaptureMatcher(type, value);
  } else {
    if (type === "regexp") {
      return function (node) {
        if (node.type !== "Literal") { return undefined; }
        if (!_.isRegExp(node.value)) { return undefined; }
        return node.value.toString() === value ? {} : undefined;
      };
    } else {
      value = literalValue(type, value);

      return function (node) {
        if (node.type !== "Literal") { return undefined; }
        return node.value === value ? {} : undefined;
      };
    }
  }
}

module.exports = {
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
};