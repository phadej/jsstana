/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("assign", function () {
  it("matches assignment operation expression nodes", function () {
    var syntax = esprima.parse("a = 2;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(assign)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("matches assignment operation expression nodes, inside expr", function () {
    var syntax = esprima.parse("a = 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (assign))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("takes operator as first parameter", function () {
    var syntax = esprima.parse("a = 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (assign =))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("throws if invalid operator given", function () {
    assert.throws(function () {
      jsstana.match("(expr (assign ==))");
    });
  });

  it("takes operator as first parameter, capture", function () {
    var syntax = esprima.parse("a = 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (assign ?op))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), { op: "=" });
  });

  it("takes operator as first parameter, non-match", function () {
    var syntax = esprima.parse("a = 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (assign +=))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });

  it("takes operands as second and third parameters", function () {
    var syntax = esprima.parse("a = 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (assign = (ident ?name) 2))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), { name: "a" });
  });
});

describe("=, +=, *= etc", function () {
  it("is the same as (assign op)", function () {
    var syntax = esprima.parse("a = 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (= (ident ?name) 2))");

    assert.deepEqual(matcher(node), { name: "a" });
  });
});