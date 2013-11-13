/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");
 
describe("ident", function () {
  it("zero arguments", function () {
    var syntax = esprima.parse("foo;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(ident)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  describe("one argument", function () {
    it("matches identifier", function () {
      var syntax = esprima.parse("foo;");
      var node = syntax.body[0].expression;
      var matcher = jsstana.match("(ident ?name)");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), { name: "foo" });
    });
  });
});
