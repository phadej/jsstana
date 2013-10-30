/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");
 
describe("expr", function () {
  it("zero arguments", function () {
    var syntax = esprima.parse("1 + 1;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  describe("one argument", function () {
    it("matches actual expression", function () {
      var syntax = esprima.parse("1 + 1;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr ?expr)");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node).expr.type, "BinaryExpression");
    });
  });
});