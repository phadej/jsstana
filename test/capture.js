/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("capture: ?", function () {
  it("without name, it doesn't really do anythin", function () {
    var syntax = esprima.parse("true;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(? literal ?val)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), { val: true });
  });

  it("you can prepend it to any expression", function () {
    var syntax = esprima.parse("true;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(?node literal ?val)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), { node: { type: "Literal", value: true, raw: "true" }, val: true });
  });
});
