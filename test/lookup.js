/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("lookup", function () {
  it("makes it easier to work with properties", function () {
    var syntax = esprima.parse("foo.bar.baz");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(lookup foo.bar.baz)");

    assert.deepEqual(matcher(node), {});
  });

  it("makes it easier to work with properties 2", function () {
    var syntax = esprima.parse("foo.quux.baz");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(lookup foo.bar.baz)");

    assert.deepEqual(matcher(node), undefined);
  });

  it("makes it easier to work with properties 2", function () {
    var syntax = esprima.parse("foo.bar");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("(lookup ?object.?property)");

    var m = matcher(node);

    assert.equal(m.object.type, "Identifier");
    assert.equal(m.property.type, "Identifier");

    assert.equal(m.object.name, "foo");
    assert.equal(m.property.name, "bar");
  });
});

describe("shorthand lookup", function () {
  it("makes it easier to work with properties", function () {
    var syntax = esprima.parse("foo.bar.baz");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("foo.bar.baz");

    assert.deepEqual(matcher(node), {});
  });

  it("makes it easier to work with properties 2", function () {
    var syntax = esprima.parse("foo.quux.baz");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("foo.bar.baz");

    assert.deepEqual(matcher(node), undefined);
  });

  it("makes it easier to work with properties 2", function () {
    var syntax = esprima.parse("foo.bar");
    var node = syntax.body[0].expression;
    var matcher = jsstana.match("?object.?property");

    var m = matcher(node);

    assert.equal(m.object.type, "Identifier");
    assert.equal(m.property.type, "Identifier");

    assert.equal(m.object.name, "foo");
    assert.equal(m.property.name, "bar");
  });
});
