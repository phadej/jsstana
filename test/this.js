/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("this", function () {
  it("matches operator", function () {
    var syntax = esprima.parse("this;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(this)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("matches operator", function () {
    var syntax = esprima.parse("this;");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("this");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });
});
