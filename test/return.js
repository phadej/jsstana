/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");
 
describe("return", function () {
  it("zero argument version matches any return statement", function () {
    var syntax = esprima.parse("(function () { return 1; })");
    var node = syntax.body[0].expression.body.body[0];
    var matcher = jsstana.match("(return)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("one argument version captures result", function () {
    var syntax = esprima.parse("(function () { return 1; })");
    var node = syntax.body[0].expression.body.body[0];
    var matcher = jsstana.match("(return ?value)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), { value: { type: "Literal", value: 1 } });
  });

  it("first argument may be identifier", function () {
    var syntax = esprima.parse("(function () { return foo; })");
    var node = syntax.body[0].expression.body.body[0];
    var matcher = jsstana.match("(return foo)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("first argument may be identifier", function () {
    var syntax = esprima.parse("(function () { return foo; })");
    var node = syntax.body[0].expression.body.body[0];
    var matcher = jsstana.match("(return bar)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });
});