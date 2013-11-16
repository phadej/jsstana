#!/usr/bin/env node

"use strict";

var optimist = require("optimist");
var fs = require("fs");
var walk = require("walkdir");
var _ = require("underscore");
var path = require("path");
var esprima = require("esprima");
var estraverse = require("estraverse");

require("colors");

var jsstana = require("../lib/jsstana.js");

var LONG_LINE_LENGTH = 120;

optimist.usage("jsgrep [options] pattern file.js [file2.js] [dir]");

optimist.boolean("h").options("h", {
  alias: "help",
  describe: "Show brief help information",
});

optimist.boolean("v").options("v", {
  alias: "version",
  describe: "Display version information and exit.",
});

optimist.boolean("n").options("n", {
  alias: "line-number",
  describe: "Each output line is preceded by its relative line number in the file.",
  default: true,
});

optimist.boolean("H").options("H", {
  alias: "file-name",
  describe: "Always print filename headers with output lines.",
  default: true,
});

optimist.boolean("l").options("l", {
  alias: "long-lines",
  describe: "Print long (over " + LONG_LINE_LENGTH + " characters long) lines.",
  default: false,
});

optimist.boolean("s").options("s", {
  alias: "shebang",
  describe: "Strip shebang from input files",
  default: true,
});

function beautifyPath(p) {
  var parts = p.split(path.sep).reverse();

  var ret = parts[0];

  for (var i = 1; i < parts.length; i++) {
    var newret = path.join(parts[i], ret);

    if (newret.length > 30) {
      return path.join("...", ret);
    } else {
      ret = newret;
    }
  }

  return ret;
}

function colorizeLine(line, steps) {
  steps = _.sortBy(steps, "pos");

  var prevPos = 0;
  var currVal = 0;
  var buf = "";

  _.each(steps, function (step) {
    var currPos = step.pos;
    var part = line.substr(prevPos, currPos - prevPos);

    switch (currVal) {
      case 0:
        break;
      case 1:
        part = part.red;
        break;
      case 2:
        part = part.yellow;
        break;
      case 3:
        part = part.green;
        break;
      default:
        part = part.blue;
    }

    buf += part;

    currVal = currVal + step.val;
    prevPos = currPos;
  });

  return buf;
}

function cli(argv) {
  var options = optimist.parse(argv);

  if (options.help) {
    console.log(optimist.help());
    return 0;
  }

  if (options.version) {
    var pkg = JSON.parse(fs.readFileSync(__dirname + "/../package.json"));
    console.log("jsgrep, part of jsstana version " + pkg.version);
    return 0;
  }

  if (options._.length < 1) {
    console.error("Error: pattern is required");
    console.log(optimist.help());
    return 0;
  }

  var pattern = options._[0];
  var files = options._.slice(1);
  if (files.length === 0) {
    files = ["."];
  }

  try {
    pattern = jsstana.match(pattern);
  } catch (e) {
    console.error("Error: ".red + "invalid pattern -- " + e.message);
    return 1;
  }

  _.each(files, function (file) {
    var absfile = path.resolve(file);

    if (!fs.existsSync(absfile)) {
      console.log("Error: ".red + " file not exists -- " + file);
      return;
    }

    walk.sync(absfile, { "no_return": true }, function (p /*, stat */) {
      p = path.resolve(p);

      if (p === absfile || p.match(/\.js$/)) {
        var relpath = p === absfile ? file : p.replace(absfile, "");
        relpath = beautifyPath(relpath);

        var contents = fs.readFileSync(p);

        // strip shebang
        if (options.shebang) {
          contents = contents.toString();
          var m = contents.match(/^#![^\n]*\n/);
          if (m) {
            contents = contents.substr(m[0].length - 1);
          }
        }

        var syntax;
        try {
          syntax = esprima.parse(contents, { tolerant: true, range: true, loc: true });
        } catch (e) {
          console.log("Error: ".red + "cannot parse " + relpath.bold + " -- " + e.message);
        }
        var lines;

        estraverse.traverse(syntax, {
          enter: function(node /* , parent */) {
            var match = pattern(node);
            if (match) {
              if (!lines) {
                lines = contents.toString().split(/\n/);
              }

              var lineNumber = node.loc.start.line;
              var line = lines[lineNumber - 1];

              var prefix;
              if (options.H && options.n) {
                prefix = relpath + ":" + lineNumber + ":";
              } else if (options.H) {
                prefix = relpath + ":";
              } else if (options.n) {
                prefix = lineNumber + ":";
              }

              // Gather steps for colorize
              var steps = [{ val: 1, pos: node.loc.start.column }];
              if (node.loc.start.line === node.loc.end.line) {
                steps.push({ val: -1, pos: node.loc.end.column });
              }

              _.each(match, function (matchNode) {
                if (matchNode && matchNode.loc) {
                  steps.push({ val: 1, pos: matchNode.loc.start.column });
                  steps.push({ val: -1, pos: matchNode.loc.end.column });
                }
              });
              steps.push({ val: -1, pos: line.length });

              // truncate line if it's too long
              if (line.length > LONG_LINE_LENGTH && !options.l) {
                var start = Math.max(0, steps[0].pos - 10);
                var linePrefix = (start === 0 ? "" : "..." );
                var lineSuffix = (start + LONG_LINE_LENGTH < line.length ? "..." : "");

                _.each(steps, function (s) {
                  s.pos = s.pos - start + (start === 0 ? 0 : 3);
                });

                line = linePrefix + line.substr(start, LONG_LINE_LENGTH) + lineSuffix;
              }

              // print match
              console.log(prefix.bold + " " + colorizeLine(line, steps));
            }
          },
        });
      }
    });
  });
}

var ret = cli(process.argv.slice(2));
process.exit(ret);
