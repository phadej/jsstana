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
    console.error("Error: invalid pattern -- " + e.message);
    return 1;
  }

  _.each(files, function (file) {
    var absfile = path.resolve(file);

    walk.sync(file, { "no_return": true }, function (p /*, stat */) {
      p = path.resolve(p);

      if (p === absfile || p.match(/\.js$/)) {
        var relpath = p === absfile ? file : p.replace(absfile, "");
        relpath = beautifyPath(relpath);

        var contents = fs.readFileSync(p);
        var syntax = esprima.parse(contents, { tolerant: true, range: true, loc: true });

        var lines;

        estraverse.traverse(syntax, {
          enter: function(node /* , parent */) {
            if (pattern(node)) {
              if (!lines) {
                lines = contents.toString().split(/\n/);
              }

              var lineNumber = node.loc.start.line;
              var line = lines[lineNumber - 1];

              var prefix;
              if (options.H && options.n) {
                prefix = relpath + ":" + lineNumber + ": ";
              } else if (options.H) {
                prefix = relpath + ": ";
              } else if (options.n) {
                prefix = lineNumber + ": ";
              }

              var before = line.substr(0, node.loc.start.column - 1);
              var match;
              var after;
              if (node.loc.start.line === node.loc.end.line) {
                match = line.substr(node.loc.start.column - 1, node.loc.end.column - node.loc.start.column + 1);
                after = line.substr(node.loc.end.column);
              } else {
                match = line.substr(node.loc.start.column - 1);
                after = "";
              }

              console.log(prefix + before + match.red + after);
            }
          },
        });
      }
    });
  });
}

var ret = cli(process.argv.slice(2));
process.exit(ret);