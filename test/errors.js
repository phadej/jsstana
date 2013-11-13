/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
 
describe("match()", function () {
  it("throws if invalid rator is found", function () {
    assert.throws(function () {
      jsstana.match("(lazy-dog-jumped-over-quick-brown-fox)");
    });
  });

  it("throws if invalid rator is found, suggests", function () {
    assert.throws(function () {
      jsstana.match("(cal)");
    });
  });

  it("throws if invalid s-expression is passed", function () {
    assert.throws(function () {
      jsstana.match("(return");
    });
  });
});
