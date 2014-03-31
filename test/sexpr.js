/* global describe:true, it:true */
"use strict";

var sexpr = require("../lib/sexpr.js");
var assert = require("assert");
 
describe("parse()", function () {
  it("parses number", function () {
    var expected = 123;
    var s = "123";

    assert.deepEqual(sexpr.parse(s), expected);
  });

  it("parses s-expressions", function () {
    var expected = ["foo", 1, 2, ["bar", 3, "1 + 2"]];
    var s = "(foo 1 2 (bar 3 '1 + 2'))";

    assert.deepEqual(sexpr.parse(s), expected);
  });

  it("parses s-expressions, unquoting", function () {
    var expected = ["foo", 1, 2, ["bar", 3, "1 \\ 2"]];
    var s = "(foo 1 2 (bar 3 \"1 \\\\ 2\"))";

    assert.deepEqual(sexpr.parse(s), expected);
  });
});

describe("stringify()", function () {
  it("parse . stringify === id", function () {
    var s = ["foo", 1, "2", "", ["bar", 3, "1 + 2"], [], ["single"], [["op"], "foo", "bar"]];
    var r = sexpr.parse(sexpr.stringify(s));

    assert.deepEqual(r, s);
    assert.strictEqual(s[1], r[1]);
    assert.strictEqual(s[2], r[2]);
  });

  it("makes tight string", function () {
    var s = ["foo", 1, 2, ["bar", 3, "1 + 2"]];
    var expected = "(foo 1 2 (bar 3 '1 + 2'))";

    assert.deepEqual(sexpr.stringify(s), expected);
  });

  it("quotes", function () {
    var s = ["foo", 1, 2, ["bar", 3, "1 '+ 2"]];
    var expected = "(foo 1 2 (bar 3 '1 \\'+ 2'))";

    assert.deepEqual(sexpr.stringify(s), expected);
  });

  it("throws if non valid sexpr passed", function () {
    assert.throws(function () {
      sexpr.stringify(true);
    });
  });
});
