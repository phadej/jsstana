/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");
var _ = require("underscore");

var constants = {
  "null": "null",
  "false": "false",
  "true": "true",
  "nan": "NaN",
  "infinity": "Infinity",
  "undefined": "undefined",
};

_.each(constants, function (jsvalue, rator) {
  describe(rator, function () {
    it("matches literal " + jsvalue, function () {
      var syntax = esprima.parse(jsvalue);
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (" + rator + "))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("doesn't match literal string", function () {
      var syntax = esprima.parse("'foo';");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (" + rator + "))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    _.each(constants, function (jsvalue2, rator2) {
      if (rator !== rator2) {
       it("doesn't match literal " + jsvalue2, function () {
        var syntax = esprima.parse(jsvalue2);
        var node = syntax.body[0];
        var matcher = jsstana.match("(expr (" + rator + "))");

        assert.deepEqual(matcher(syntax), undefined);
        assert.deepEqual(matcher(node), undefined);
      });
      }
    });
  });
});
