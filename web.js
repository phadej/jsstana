/* global $, CodeMirror, Bacon */
"use strict";

var esprima = require("esprima");
var estraverse = require("estraverse");
var jsstana = require("./lib/jsstana.js");

$(function () {
  var codeTextarea = $("#code textarea");
  var errorsEl = $("#errors");
  var patternInput = $("#pattern input[type=text]");
  var messages = $("#messages .inner");

  var cm = CodeMirror.fromTextArea(codeTextarea[0], {
    mode: "javascript",
    styleSelectedText: true,
    lineNumbers: true,
  });

  var codeCm = $("#code .CodeMirror");

  var marker;
  var markedNode;

  // parsed state
  var errorLineH;

  var currentNode = new Bacon.Bus();
  currentNode.skipDuplicates().onValue(function (node) {
    if (marker) {
      marker.clear();
    }

    markedNode = node;

    var from = new CodeMirror.Pos(node.loc.start.line - 1, node.loc.start.column);
    var to = new CodeMirror.Pos(node.loc.end.line - 1, node.loc.end.column);

    marker = cm.markText(from, to, { className: "highlight" });
  });

  function clearMessages() {
    messages.html("<p>No matches.</p>");
  }

  function cmClass(v) {
    if (typeof v === "string") {
      return "cm-string";
    } else if (typeof v === "number") {
      return "cm-number";
    } else if (v === undefined || v === null || v === true || v === false) {
      return "cm-atom";
    } else if (v instanceof RegExp) {
      return "cm-string-2";
    } else {
      return "cm-property";
    }
  }

  function populateMessages(matches) {
    if (matches.length === 0) {
      clearMessages();
      return;
    }

    var ul = $("<ul>");
    matches.forEach(function (obj, i) {
      var li = $("<li>").html("match " + (i+1) + " on line " + obj.node.loc.start.line);

      li.mousemove(function (ev) {
        ev.stopPropagation();
        currentNode.push(obj.node);
      });

      var keys = Object.keys(obj.m);
      if (keys.length !== 0) {
        var subul = $("<ul>");

        keys.forEach(function (key) {
          var v = obj.m[key];
          var subli = $("<li>");
          subli.append($("<code>").html(key));
          subli.append(": ");
          if (Array.isArray(v)) {
            subli.append("Array of length " + v.length);
          } else if (v.type) {
            subli.append($("<em>").html(v.type));
            if (v.type === "Identifier") {
              subli.append(" ");
              subli.append($("<code>").addClass("cm-variable-2").html(v.name));
            } else if (v.type === "Literal") {
              subli.append(" ");
              subli.append($("<code>").addClass(cmClass(v.value)).html(v.raw));
            }

            subli.mousemove(function (ev) {
              ev.stopPropagation();
              currentNode.push(v);
            });
            subli.click(function () {
              console.log(key, v);
            });
          } else {
            subli.append($("<code>").addClass(cmClass(v)).html(typeof v === "string" ? JSON.stringify(v) : v));
          }

          subul.append(subli);
        });

        li.append(subul);
      }

      ul.append(li);
    });

    messages.html(ul);
  }

  var patternBus = new Bacon.Bus();
  var codeBus = new Bacon.Bus();

  function tryWrap(f) {
    return function (value) {
      try {
        return Bacon.once(f(value));
      } catch (err) {
        return Bacon.once(new Bacon.Error(err));
      }
    };
  }

  var $pattern = patternBus.skipDuplicates().flatMap(tryWrap(jsstana.match));

  $pattern.onError(function (err) {
    errorsEl.html(err.toString());
    patternInput.addClass("error");
    return new Bacon.Error(err);
  });

  var $ast = codeBus.skipDuplicates().flatMap(tryWrap(function (text) {
    return esprima.parse(text, { tolerant: true, loc: true, range: true, raw: true });
  }));

  $ast.onError(function (err) {
    errorsEl.html(err.toString());
    codeCm.addClass("error");

    errorLineH = cm.getLineHandle(err.lineNumber - 1);
    if (errorLineH) {
      cm.addLineClass(errorLineH, "background", "error-line");
    }
  });

  var $matches = $pattern.combine($ast, function (pattern, ast) {
    var matches = [];
    estraverse.traverse(ast, {
      enter: function (node) {
        var m = pattern(node);
        if (m) {
          matches.push({ node: node, m: m });
        }
      }
    });
    return matches;
  });

  $matches.onValue(function (matches) {
    // clear errors
    errorsEl.html("");
    patternInput.removeClass("error");
    codeCm.removeClass("error");

    if (errorLineH) {
      cm.removeLineClass(errorLineH, "background", "error-line");
      errorLineH = undefined;
    }

    // popupate matches
    if (matches.length === 0) {
      clearMessages();
    } else {
      populateMessages(matches);
    }
  });

  patternInput.on("input", function () {
    patternBus.push($(patternInput).val());
  });

  cm.on("change", function () {
    codeBus.push(cm.getValue());
  });

  $("#examples a").click(function (ev) {
    patternInput.val($(this).text());
    patternBus.push(patternInput.val());
    ev.preventDefault();
  });

  patternBus.push(patternInput.val());
  codeBus.push(cm.getValue());
});
