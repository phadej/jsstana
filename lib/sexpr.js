"use string";

var p = require("packrattle");
var _ = require("underscore");

var whitespaceP = p.regex(/\s*/);

function lexemeP(parser) {
  return p.seq(parser, whitespaceP).onMatch(_.first);
}

var sexprP = p.alt(
  p.seq(lexemeP("("), p.repeat(function () { return sexprP; }), lexemeP(")")).onMatch(function (arr) { return arr[1]; }),
  lexemeP(p.regex(/[a-zA-Z\?\.\-\/*+<>=!%,][a-zA-Z0-9_\?\.\-\/*+<>+!%,]*/)).onMatch(_.first),
  lexemeP(p.regex(/[0-9]+/)).onMatch(function (m) { return parseInt(_.first(m), 10); } )
);

function parse(input) {
  var parser = p.seq(sexprP, p.end).onMatch(_.last);
  var res = p.consume(parser, input);

  if (res.ok) {
    return res.match;
  } else {
    throw new Error(res.message);
  }
}

module.exports = {
  parse: parse,
};