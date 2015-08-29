/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

var source = [
  "var str = (age < 1) ? 'baby' :",
  "  (age < 5) ? 'toddler' :",
  "  (age < 18) ? 'child': 'adult';",
].join("\n");

describe("nested-ternary", function () {
  it("finds nested ternary", function () {
    var found = false;
    var syntax = esprima.parse(source);
    var nestedMatcherCon = jsstana.match("(ternary ?cond (ternary))");
    var nestedMatcherAlt = jsstana.match("(ternary ?cond ? (ternary))");

    jsstana.traverse(syntax, function (node) {
      if (nestedMatcherAlt(node) !== undefined) {
        found = true;
        return false; // cancel the traversal
      }

      if (nestedMatcherCon(node) !== undefined) {
        found = true;
        return false; // cancel the traversal
      }
    });

    assert(found, "there should be nested ternary expressions");
  });
});
