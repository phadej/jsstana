/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("new", function () {
  it("zero arguments", function () {
    var syntax = esprima.parse("new Foo()");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(new)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("first argument matches function", function () {
    var syntax = esprima.parse("new Foo()");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(new Foo)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("first argument matches function, not match", function () {
    var syntax = esprima.parse("new Foo()");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(new Bar)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });

  it("first argument matches function, lookup", function () {
    var syntax = esprima.parse("new module.Foo()");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(new (lookup module.Foo))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("consecutive arguments match arguments", function () {
    var syntax = esprima.parse("new module.Foo(foo, bar)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(new (lookup module.Foo) foo bar)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("matches exact amout of arguments", function () {
    var syntax = esprima.parse("new module.Foo(foo, bar, baz)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(new (lookup module.Foo) foo bar)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });

  it("can use (new fun . ?) to match rest arguments", function () {
    var syntax = esprima.parse("new module.Foo(foo, bar, baz, quux)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(new (lookup module.Foo) ??)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("can use (new . ?dotted-syntax) to capture rest arguments", function () {
    var syntax = esprima.parse("new module.Foo(foo, bar, baz, quux)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(new (lookup module.Foo) foo ? ??rest)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node).rest.length, 2);
  });
});
