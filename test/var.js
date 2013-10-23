/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");
 
describe("var", function () {
  it("zero arguments", function () {
    var syntax = esprima.parse("var foo = 1;");
    var node = syntax.body[0].declarations[0];
    var matcher = jsstana.match("(var)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  describe("one argument", function () {
    it("pattern", function () {
      var syntax = esprima.parse("var foo = 1;");
      var node = syntax.body[0].declarations[0];
      var matcher = jsstana.match("(var ?name)");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), { name: "foo" });
    });

    it("identifier", function () {
      var syntax = esprima.parse("var foo = 1;");
      var node = syntax.body[0].declarations[0];
      var matcher = jsstana.match("(var foo)");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("non-matching identifier", function () {
      var syntax = esprima.parse("var foo = 1;");
      var node = syntax.body[0].declarations[0];
      var matcher = jsstana.match("(var bar)");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });
  });

  describe("two arguments", function () {
    it("captures init", function () {
      var syntax = esprima.parse("var foo = 1;");
      var node = syntax.body[0].declarations[0];
      var matcher = jsstana.match("(var foo ?init)");

      var m = matcher(node);
      assert.equal(m.init.type, "Literal");
    });

    it("supports var assigment", function () {
      var syntax = esprima.parse("var foo = bar;");
      var node = syntax.body[0].declarations[0];
      var matcher = jsstana.match("(var foo bar)");

      assert.deepEqual(matcher(node), {});
    });

    it("supports var assigment 2", function () {
      var syntax = esprima.parse("var foo = bar;");
      var node = syntax.body[0].declarations[0];
      var matcher = jsstana.match("(var foo baz)");

      assert.deepEqual(matcher(node), undefined);
    });
  });
});