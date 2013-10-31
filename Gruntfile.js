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
      bin: {
        src: ["bin/**/*.js"]
      }
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
    literate: {
      "README.md": "lib/jsstana.js",
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-simple-mocha");
  grunt.loadNpmTasks("grunt-mocha-cov");
  grunt.loadNpmTasks("grunt-literate");

  // Default task.
  grunt.registerTask("default", ["jshint", "simplemocha"]);
};
