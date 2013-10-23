/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");
 
describe("ternary", function () {
  it("zero arguments", function () {
    var syntax = esprima.parse("foo ? bar : baz");
    var node = syntax.body[0].expression;
    var matcher = jsstana.pattern("(ternary)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("many arguments", function () {
    var syntax = esprima.parse("foo ? bar : baz");
    var node = syntax.body[0].expression;
    var matcher = jsstana.pattern("(ternary foo bar baz)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });
});