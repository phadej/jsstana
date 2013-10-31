/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("unary", function () {
  it("matches binary operation expression nodes", function () {
    var syntax = esprima.parse("!true;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(unary)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("matches binary operation expression nodes, inside expr", function () {
    var syntax = esprima.parse("-1;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (unary))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("takes operator as first parameter", function () {
    var syntax = esprima.parse("-1;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (unary -))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("takes operator as first parameter, capture", function () {
    var syntax = esprima.parse("-1;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (unary ?op))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), { op: "-" });
  });

  it("takes operator as first parameter, non-match", function () {
    var syntax = esprima.parse("~1;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (unary -))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });

  it("takes operand as second paramater, non-match", function () {
    var syntax = esprima.parse("+1;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (unary + (number ?number)))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), { number: 1 });
  });
});

describe("~ !", function () {
  it("is the same as (unary op)", function () {
    var syntax = esprima.parse("!true;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(expr (! true))");

    assert.deepEqual(matcher(node), {});
  });
});