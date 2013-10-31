/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("postfix prefix", function () {
  it("matches postfix/prefix updates, inside expr", function () {
    var syntax = esprima.parse("foo++;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(postfix)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("matches postfix/prefix updates, inside expr", function () {
    var syntax = esprima.parse("foo++;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (postfix))");

    assert.deepEqual(matcher(node), {});
  });

  it("captures operator", function () {
    var syntax = esprima.parse("foo++;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (postfix ?op))");

    assert.deepEqual(matcher(node), { op: "++" });
  });

  it("destinguish between ++foo and foo++", function () {
    var syntax = esprima.parse("foo++;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (postfix ++ foo))");

    assert.deepEqual(matcher(node), {});
  });

  it("destinguish between ++foo and foo++, 2", function () {
    var syntax = esprima.parse("foo++;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (prefix ++ foo))");

    assert.deepEqual(matcher(node), undefined);
  });

  it("destinguish between ++foo and foo++, 3", function () {
    var syntax = esprima.parse("++foo;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (postfix ++ foo))");

    assert.deepEqual(matcher(node), undefined);
  });

  it("destinguish between ++foo and foo++, 4", function () {
    var syntax = esprima.parse("++foo;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (prefix ++ foo))");

    assert.deepEqual(matcher(node), {});
  });
});