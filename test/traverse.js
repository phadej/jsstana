/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("traverse()", function () {
  it("calls callback on each node", function () {
    var i = 0;
    var syntax = esprima.parse("var foo = 1;", { comments: true, tokens: true, loc: true, range: true });

    jsstana.traverse(syntax, function () {
      i += 1;
    });

    assert(i, 4, "there is 4 nodes");
  });
});
