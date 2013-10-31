/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("binary", function () {
  it("matches binary operation expression nodes", function () {
    var syntax = esprima.parse("1 + 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (binary))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("takes operator as first parameter", function () {
    var syntax = esprima.parse("1 + 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (binary +))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("takes operator as first parameter, capture", function () {
    var syntax = esprima.parse("1 + 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (binary ?op))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), { op: "+" });
  });

  it("takes operator as first parameter, non-match", function () {
    var syntax = esprima.parse("1 + 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (binary -))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });

  it("takes operands as second and third parameters, non-match", function () {
    var syntax = esprima.parse("1 + 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (binary + (literal-number ?number) 2))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), { number: 1 });
  });
});

describe("+, -, * etc", function () {
  it("is the same as (binary op)", function () {
    var syntax = esprima.parse("1 + 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (+ (literal-number ?number) 2))");

    assert.deepEqual(matcher(node), { number: 1 });
  });
});