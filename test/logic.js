/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");
 
describe("not", function () {
  it("negates the match", function () {
    var syntax = esprima.parse("1;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(not 2)");

    assert.deepEqual(matcher(syntax), {});
    assert.deepEqual(matcher(node), {});
  });

   it("negates the match", function () {
    var syntax = esprima.parse("1;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(not 1)");

    assert.deepEqual(matcher(syntax), {});
    assert.deepEqual(matcher(node), undefined);
  });

  it("doesn't match anything if used without arguments", function () {
    var syntax = esprima.parse("1;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(not)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });
});

describe("or", function () {
  it("fail always with zero arguments", function () {
    var syntax = esprima.parse("1;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(or)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), undefined);
  });

  it("return first match", function () {
    var syntax = esprima.parse("1;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(or (string) (number ?num) ?node)");

    assert.deepEqual(matcher(node), { num: 1 });
  });

  it("fails if every fails", function () {
    var syntax = esprima.parse("1;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(and (bool ?a) (string ?b))");

    assert.deepEqual(matcher(node), undefined);
  });
});

describe("and", function () {
  it("succeeds always with zero arguments", function () {
    var syntax = esprima.parse("1;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(and)");

    assert.deepEqual(matcher(syntax), {});
    assert.deepEqual(matcher(node), {});
  });

  it("combines matches", function () {
    var syntax = esprima.parse("1;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(and (number ?a) (number ?b))");

    assert.deepEqual(matcher(node), { a: 1, b: 1 });
  });

  it("fails if any fails", function () {
    var syntax = esprima.parse("1;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(and (number ?a) (string ?b))");

    assert.deepEqual(matcher(node), undefined);
  });
});

describe("nor", function () {
  it("is the same as (not (or ...))", function () {
    var syntax = esprima.parse("1;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(nor (number ?a) (string ?b))");
    var matcher2 = jsstana.match("(not (or (number ?a) (string ?b)))");

    assert.deepEqual(matcher(node), matcher2(node));
  });

  it("is the same as (not (or ...)), 2", function () {
    var syntax = esprima.parse("true;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(nor (number ?a) (string ?b))");
    var matcher2 = jsstana.match("(not (or (number ?a) (string ?b)))");

    assert.deepEqual(matcher(node), matcher2(node));
  });
});

describe("nand", function () {
  it("is the same as (not (and ...))", function () {
    var syntax = esprima.parse("1;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(nand (number ?a) (string ?b))");
    var matcher2 = jsstana.match("(not (and (number ?a) (string ?b)))");

    assert.deepEqual(matcher(node), matcher2(node));
  });

  it("is the same as (not (and ...)), 2", function () {
    var syntax = esprima.parse("true;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(nand (number ?a) (literal ?b))");
    var matcher2 = jsstana.match("(not (and (number ?a) (literal ?b)))");

    assert.deepEqual(matcher(node), matcher2(node));
  });
});
