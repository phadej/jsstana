/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("object", function () {
  it("matches object expressions", function () {
    var syntax = esprima.parse("({})");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(object)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });
});
