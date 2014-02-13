/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");
 
describe("fn-expr", function () {
  it("matches function expressions", function () {
    var syntax = esprima.parse("(function () { return 1; })");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(fn-expr)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });
});
