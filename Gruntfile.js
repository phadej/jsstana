"use strict";

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    simplemocha: {
      options: {
        timeout: 3000,
        ui: "bdd",
        reporter: "spec"
      },

      all: { src: "test/**/*.js" }
    },
    mochacov: {
      options: {
        reporter: "html-cov",
        output: "coverage.html",
      },
      all: { src: "test/**/*.js" }
    },
    jshint: {
      options: {
        jshintrc: ".jshintrc"
      },
      gruntfile: {
        src: "Gruntfile.js"
      },
      lib: {
        src: ["lib/**/*.js"]
      },
      test: {
        src: ["test/**/*.js"]
      },
    },
    watch: {
      gruntfile: {
        files: "<%= jshint.gruntfile.src %>",
        tasks: ["jshint:gruntfile"]
      },
      lib: {
        files: "<%= jshint.lib.src %>",
        tasks: ["jshint:lib", "simplemocha"]
      },
      test: {
        files: "<%= jshint.test.src %>",
        tasks: ["jshint:test", "simplemocha"]
      },
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-simple-mocha");
  grunt.loadNpmTasks("grunt-mocha-cov");

  // Default task.
  grunt.registerTask("default", ["jshint", "simplemocha"]);

  // use esprima to generate README.md from source
  grunt.registerTask("readme", "Generate README.md", function () {
    var src = "./lib/jsstana.js";
    var dest = "README.md";
    var esprima = require("esprima");
    var _ = require("underscore");

    var content = grunt.file.read(src);
    var syntax = esprima.parse(content, { comment: true });
    var comments = syntax.comments;

    function isWhitespace(str) {
        return (/^\s*$/).test(str);
    }

    var mdContent = _.reduce(comments, function (acc, comment) {
      if (comment.type === "Block" && comment.value[0] === "*") {
        // block comment starting with /**
        var value = comment.value.slice(1);
        var lines = value.split(/\n/);
        var first = _.find(lines, function (line) { return !isWhitespace(line); } );
        var indent = first ? /^(\s*)/.exec(first)[1] : "";

        // unindent lines
        lines = _.map(lines, function (line) {
            if (line.indexOf(indent) === 0) {
                return line.replace(indent, "");
            } else if (isWhitespace(line)) {
                return "";
            } else {
                return line;
            }
        });

        return acc + lines.join("\n");

      } else {
        // do nothing with rest
        return acc;
      }
    }, "");

    grunt.file.write(dest, mdContent);
  });
};
