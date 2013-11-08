"use strict";

var _ = require("underscore");

/**
  #### (not pattern)

  Matches when `pattern` doesn't match.
*/
function notMatcher(pattern) {
  /* jshint validthis:true */
  this.assertArguments("not", 1, arguments);
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
  var argsMatchers = args.map(this.matcher, this);

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
  var argsMatchers = args.map(this.matcher, this);

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

module.exports = {
  "not": notMatcher,
  "or": orMatcher,
  "and": andMatcher,
};