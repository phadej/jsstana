/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("call", function () {
  it("zero arguments", function () {
    var syntax = esprima.parse("fun()");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(call)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("first argument matches function", function () {
    var syntax = esprima.parse("fun()");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(call fun)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("first argument matches function, not match", function () {
    var syntax = esprima.parse("fun()");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(call wrong)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });

  it("first argument matches function, lookup", function () {
    var syntax = esprima.parse("module.fun()");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(call (lookup module.fun))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("consecutive arguments match arguments", function () {
    var syntax = esprima.parse("module.fun(foo, bar)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(call (lookup module.fun) foo bar)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("matches exact amount of arguments", function () {
    var syntax = esprima.parse("module.fun(foo, bar, baz)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(call (lookup module.fun) foo bar)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });

  it("matches iff arguments matches", function () {
    var syntax = esprima.parse("module.fun(foo, bar)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(call (lookup module.fun) foo baz)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });

  it("can use (call fun ??) to match rest arguments", function () {
    var syntax = esprima.parse("module.fun(foo, bar, baz, quux)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(call (lookup module.fun) ?...)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("can use (call ??rest) to capture rest arguments", function () {
    var syntax = esprima.parse("module.fun(foo, bar, baz, quux)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(call (lookup module.fun) foo ? ??rest)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node).rest.length, 2);
  });

  it("can use (call ??prefix ?param) to capture prefix variable-arguments", function () {
    var syntax = esprima.parse("module.fun(foo, bar, baz, quux)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(call (lookup module.fun) ??prefix quux)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node).prefix.length, 3);
  });

  it("can use (call ?param-a ??infix ?param-bb) to capture infix variable-arguments", function () {
    var syntax = esprima.parse("module.fun(foo, bar, baz, quux)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(call (lookup module.fun) foo ??infix quux)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node).infix.length, 3);
  });

  it("supports only single ??parameter", function () {
    assert.throws(function () {
      jsstana.match("(call ??prefix ??suffix)");
    });
  });
});
