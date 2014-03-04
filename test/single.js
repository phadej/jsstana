/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");
 
describe("break", function () {
  it("matches", function () {
    var syntax = esprima.parse("while (true) { break; }");
    var node = syntax.body[0].body.body[0];
    var matcher = jsstana.match("(break)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });
});

describe("continue", function () {
  it("matches", function () {
    var syntax = esprima.parse("while (true) { continue; }");
    var node = syntax.body[0].body.body[0];
    var matcher = jsstana.match("(continue)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });
});
