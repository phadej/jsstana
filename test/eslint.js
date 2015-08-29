/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("eslintRule", function () {
  it("hides eslint rule creation boilerplate", function () {
    var syntax = esprima.parse("({})");
    var node = syntax.body[0].expression;
    var eslintContext = function () {};

    var module = jsstana.eslintRule("(object)", function (context) {
      assert(context === eslintContext);
    })(eslintContext);

    /* eslint-disable new-cap */
    module.ObjectExpression(node);
    module.ObjectExpression(null);
    /* eslint-enable new-cap */
  });
});
