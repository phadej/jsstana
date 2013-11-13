/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");
 
describe("ternary", function () {
  it("zero arguments", function () {
    var syntax = esprima.parse("foo ? bar : baz");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(ternary)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("many arguments", function () {
    var syntax = esprima.parse("foo ? bar : baz");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(ternary foo bar baz)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("doesn't match if any argument doesn't match 1", function () {
    var syntax = esprima.parse("quux ? bar : baz");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(ternary foo bar baz)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });

  it("doesn't match if any argument doesn't match 2", function () {
    var syntax = esprima.parse("foo ? quux : baz");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(ternary foo bar baz)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });

  it("doesn't match if any argument doesn't match 3", function () {
    var syntax = esprima.parse("foo ? bar : quux");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(ternary foo bar baz)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });
});
