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

  it("consecutive arguments match arguments, more arguments than specified", function () {
    var syntax = esprima.parse("module.fun(foo, bar, baz)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(call (lookup module.fun) foo bar)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("can use (undefined)", function () {
    var syntax = esprima.parse("module.fun(foo, bar)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(call (lookup module.fun) foo bar (undefined))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("can use (undefined)", function () {
    var syntax = esprima.parse("module.fun(foo, bar, baz)");
    var node = syntax.body[0].expression;

    var matcher = jsstana.match("(call (lookup module.fun) foo bar (undefined))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });
});