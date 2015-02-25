/* global describe:true, it:true */
/* eslint-disable new-cap */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("user provided pattern operations", function () {
  it("you can add empty-object", function () {
    var syntax = esprima.parse("a = {};");
    var node = syntax.body[0];

    var ctx = new jsstana();
    ctx.addMatcher("empty-object", function () {
      this.assertArguments("empty-object", 0, arguments);
      return function (nodex) {
        return nodex.type === "ObjectExpression" && nodex.properties.length === 0 ? {} : undefined;
      };
    });

    var matcher = ctx.match("(expr (= a (empty-object)))");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("you can add my-if", function () {
    var syntax = esprima.parse("if (true) foo();");
    var node = syntax.body[0];

    var ctx = new jsstana();
    ctx.addMatcher("my-if", function (expr) {
      this.assertArguments("my-if", 1, arguments);
      expr = expr || "?";
      var exprMatcher = this.matcher(expr);
      return function (nodex) {
        if (nodex.type !== "IfStatement") { return undefined; }
        return exprMatcher(nodex.test);
      };
    });

    var matcher = ctx.match("(my-if true)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });
});

describe("anonymous matchers", function () {
  it("you can add empty-object anonymously", function () {
    var syntax = esprima.parse("a = {};");
    var node = syntax.body[0];
    var matcher = jsstana.createMatcher("(expr (= a $0))", function (subnode) {
      return subnode.type === "ObjectExpression" && subnode.properties.length === 0 ? {} : undefined;
    });

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });
});
