/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

var source = "alert('foobar')";

describe("alert example", function () {
  it("finds alert calls", function () {
    var found = false;
    var syntax = esprima.parse(source);

    jsstana.traverse(syntax, function (node) {
      var m = jsstana.match("(call alert ?argument)", node);
      if (m) {
        found = m.argument;
        // console.log("alert called with argument", m.argument);
      }
    });

    assert(found, "there should be alert calls");
    assert.equal(found.type, "Literal");
    assert.equal(found.value, "foobar");
  });
});