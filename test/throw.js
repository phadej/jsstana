/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("throw", function () {
  it("matches throw expression", function () {
    var syntax = esprima.parse("throw 'foo';");
    var node = syntax.body[0];
    var matcher = jsstana.match("(throw)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("takes an object as first parameter", function () {
    var syntax = esprima.parse("throw 1;");
    var node = syntax.body[0];
    var matcher = jsstana.match("(throw 1)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), {});
  });

  it("takes an object as first parameter, capture", function () {
    var syntax = esprima.parse("throw 'foo';");
    var node = syntax.body[0];
    var matcher = jsstana.match("(throw ?ex)");

    assert.deepEqual(matcher(syntax), undefined);
    assert.deepEqual(matcher(node), { ex: { type: "Literal", value: "foo", raw: "'foo'" } });
  });
});
