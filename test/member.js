/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("member", function () {
  it("zero arguments", function () {
    var syntax = esprima.parse("foo.bar");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(member)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  describe("one argument", function () {
    it("pattern", function () {
      var syntax = esprima.parse("foo.bar");
      var node = syntax.body[0].expression;
      var matcher = jsstana.match("(member ?object)");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node).object.type, "Identifier");
    });

    it("identifier", function () {
      var syntax = esprima.parse("foo.bar");
      var node = syntax.body[0].expression;
      var matcher = jsstana.match("(member foo)");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("non-matching identifier", function () {
      var syntax = esprima.parse("foo.bar");
      var node = syntax.body[0].expression;
      var matcher = jsstana.match("(member bar)");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });
  });

  describe("two arguments", function () {
    it("captures property or subscript", function () {
      var syntax = esprima.parse("foo.bar");
      var node = syntax.body[0].expression;
      var matcher = jsstana.match("(member foo ?prop)");

      var m = matcher(node);
      assert.equal(m.prop.type, "Identifier");
    });

    it("supports var assigment", function () {
      var syntax = esprima.parse("foo.bar");
      var node = syntax.body[0].expression;
      var matcher = jsstana.match("(member foo bar)");

      assert.deepEqual(matcher(node), {});
    });

    it("works with array subscription", function () {
      var syntax = esprima.parse("foo[bar]");
      var node = syntax.body[0].expression;
      var matcher = jsstana.match("(member foo bar)");

      assert.deepEqual(matcher(node), {});
    });

    it("supports var assigment 2", function () {
      var syntax = esprima.parse("foo.bar");
      var node = syntax.body[0].expression;
      var matcher = jsstana.match("(member foo baz)");

      assert.deepEqual(matcher(node), undefined);
    });
  });
});

describe("property", function () {
  it("matches non-computed MemberExpression", function () {
    var syntax = esprima.parse("foo.bar");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(property)");

    assert.deepEqual(matcher(node), {});
  });

  it("does not match computed MemberExpression", function () {
    var syntax = esprima.parse("foo[bar]");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(property)");

    assert.deepEqual(matcher(node), undefined);
  });

  it("does not match computed MemberExpression 2", function () {
    var syntax = esprima.parse("foo[0]");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(property)");

    assert.deepEqual(matcher(node), undefined);
  });
});

describe("subscript", function () {
  it("matches computed MemberExpression", function () {
    var syntax = esprima.parse("foo[bar]");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(subscript)");

    assert.deepEqual(matcher(node), {});
  });

  it("does not match non-computed MemberExpression", function () {
    var syntax = esprima.parse("foo.bar");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(subscript)");

    assert.deepEqual(matcher(node), undefined);
  });
});
