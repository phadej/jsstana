/* global describe:true, it:true */
"use strict";

var jsstana = require("../lib/jsstana.js");

var assert = require("assert");
var esprima = require("esprima");

describe("literal", function () {
  describe("zero arguments", function () {
    it("matches literal strings", function () {
      var syntax = esprima.parse("'foo';");
      var node = syntax.body[0].expression;
      var matcher = jsstana.match("(literal)");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("matches literal strings, inside expr", function () {
      var syntax = esprima.parse("'foo';");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (literal))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("matches literal numbers", function () {
      var syntax = esprima.parse("1;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (literal))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("matches literal booleans", function () {
      var syntax = esprima.parse("true;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (literal))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("matches literal null", function () {
      var syntax = esprima.parse("null;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (literal))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });
  });

  describe("one argument", function () {
    it("is the same as string", function () {
      var syntax = esprima.parse("'foo'");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (string foo))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });
  });
});

describe("string", function () {
  describe("zero arguments", function () {
    it("matches literal strings", function () {
      var syntax = esprima.parse("'foo';");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (string))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("doesn't match literal numbers", function () {
      var syntax = esprima.parse("1;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (string))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match literal booleans", function () {
      var syntax = esprima.parse("true;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (string))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match literal null", function () {
      var syntax = esprima.parse("null;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (string))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match literal regexp", function () {
      var syntax = esprima.parse("/foo/;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (string))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });
  });

  describe("one argument", function () {
    it("captures the string", function () {
      var syntax = esprima.parse("'foo';");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (string ?str))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), { str: "foo" });
    });

    it("doesn't match if different string", function () {
      var syntax = esprima.parse("'foo'");
      var node = syntax.body[0].expression;
      var matcher = jsstana.match("(string foo)");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("doesn't match if different string, inside expr", function () {
      var syntax = esprima.parse("'foo'");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (string bar))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });
  });
});

describe("number", function () {
  describe("zero arguments", function () {
    it("doesn't match literal strings", function () {
      var syntax = esprima.parse("'foo';");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (number))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("matches literal numbers", function () {
      var syntax = esprima.parse("1;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (number))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("doesn't match literal booleans", function () {
      var syntax = esprima.parse("true;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (number))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match literal null", function () {
      var syntax = esprima.parse("null;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (number))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match literal regexp", function () {
      var syntax = esprima.parse("/foo/;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (number))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });
  });

  describe("one argument", function () {
    it("captures the number", function () {
      var syntax = esprima.parse("1;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (number ?number))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), { number: 1 });
    });

    it("doesn't match if different number", function () {
      var syntax = esprima.parse("null;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (number 2))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("throws if invalid parameter", function () {
      assert.throws(function () {
        jsstana.match("(expr (number foo))");
      });
    });
  });
});

describe("bool", function () {
  describe("zero arguments", function () {
    it("doesn't match literal strings", function () {
      var syntax = esprima.parse("'foo';");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (bool))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match literal numbers", function () {
      var syntax = esprima.parse("1;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (bool))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("matches literal booleans", function () {
      var syntax = esprima.parse("true;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (bool))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("doesn't match literal null", function () {
      var syntax = esprima.parse("null;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (bool))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match literal regexp", function () {
      var syntax = esprima.parse("/foo/;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (bool))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });
  });

  describe("one argument", function () {
    it("captures the boolean", function () {
      var syntax = esprima.parse("true;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (bool ?bool))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), { bool: true });
    });

    it("matches if same boolean", function () {
      var syntax = esprima.parse("true;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (bool true))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("matches if same boolean", function () {
      var syntax = esprima.parse("false;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (bool false))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("doesn't match if different boolean", function () {
      var syntax = esprima.parse("true;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (bool false))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match if different boolean 2", function () {
      var syntax = esprima.parse("false;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (bool true))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("throws if invalid parameter", function () {
      assert.throws(function () {
        jsstana.match("(expr (bool null))");
      });
    });
  });
});

describe("regexp", function () {
  describe("zero arguments", function () {
    it("matches literal regexp", function () {
      var syntax = esprima.parse("/foo/;");
      var node = syntax.body[0].expression;
      var matcher = jsstana.match("(regexp /foo/)");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("doesn't match literal strings", function () {
      var syntax = esprima.parse("'foo';");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (regexp))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match literal numbers", function () {
      var syntax = esprima.parse("1;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (regexp))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match literal booleans", function () {
      var syntax = esprima.parse("true;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (regexp))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match literal null", function () {
      var syntax = esprima.parse("null;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (regexp))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("matches literal regexp, inside expr", function () {
      var syntax = esprima.parse("/foo/;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (regexp))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("doesn't match different literal regexp, inside expr", function () {
      var syntax = esprima.parse("/foo/;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (regexp /bar/))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't match not regexp, inside expr", function () {
      var syntax = esprima.parse("1;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (regexp /bar/))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });
  });

  describe("one argument", function () {
    it("captures the regexp", function () {
      var syntax = esprima.parse("/foo/;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (regexp ?regexp))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node).regexp.toString(), "/foo/");
    });

    it("matches if same boolean", function () {
      var syntax = esprima.parse("/foo/;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (regexp /foo/))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), {});
    });

    it("doesn't match if different boolean", function () {
      var syntax = esprima.parse("/bar/;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (regexp /foo/))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });

    it("doesn't know about regexp equivalence", function () {
      var syntax = esprima.parse("/aa*/;");
      var node = syntax.body[0];
      var matcher = jsstana.match("(expr (regexp /a+/))");

      assert.deepEqual(matcher(syntax), undefined);
      assert.deepEqual(matcher(node), undefined);
    });
  });
});
