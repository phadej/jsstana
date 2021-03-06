/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("binary", function () {
  it("matches binary operation expression nodes", function () {
    var syntax = esprima.parse("1 + 2;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(binary)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("matches binary operation expression nodes, inside expr", function () {
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

  it("throws if invalid operator given", function () {
    assert.throws(function () {
      jsstana.match("(expr (binary +++))");
    });
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

  it("takes operands as second and third parameters", function () {
    var syntax = esprima.parse("1 + 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (binary + (number ?number) 2))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), { number: 1 });
  });

  describe("special cases", function () {
    it("instanceof", function () {
      var syntax = esprima.parse("!x instanceof Number;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (instanceof (! ?) ?))");

      assert.deepEqual(matcher(node), {});
    });

    it("in", function () {
      var syntax = esprima.parse("x in obj;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (in ? ?))");

      assert.deepEqual(matcher(node), {});
    });
  });
});

describe("+, -, * etc", function () {
  it("is the same as (binary op)", function () {
    var syntax = esprima.parse("1 + 2;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (+ (number ?number) 2))");

    assert.deepEqual(matcher(node), { number: 1 });
  });
});
