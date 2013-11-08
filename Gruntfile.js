"use strict";

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    simplemocha: {
      options: {
        timeout: 3000,
        ui: "bdd",
        reporter: "spec"
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
      },
      web: {
        src: ["web.js"],
        options: {
          browser: true,
          node: false,
        },
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
      less: {
        files: "<%= less.web.src %>",
        tasks: ["less"],
      },
      browserify: {
        files: "<%= browserify.web.src %>",
        tasks: ["browserify"],
      },
    },
    literate: {
      "README.md": "lib/jsstana.js",
    },
    browserify: {
      web: {
        src: [
          "lib/jsstana.js",
          "web.js",
        ],
        dest: "web.bundle.js",
      },
    },
    less: {
      web: {
        src: [
          "web.less",
        ],
        dest: "web.min.css",
        options: {
          report: "min",
          compress: true,
          strictMath: true,
          strictImports: true,
          strictUnits: true,
          syncImport: true,
          sourceMap: true,
          sourceMapFilename: "web.min.css.map",
        }
      },
    },
    uglify: {
      web: {
        banner: "/* <%= pkg.name %> - <%= pkg.version %> */",
        src: [
          "components/codemirror.js",
          "components/cm-mode-javascript.js",
          "components/jquery-2.0.3.js",
          "web.bundle.js",
        ],
        dest: "web.min.js",
        options: {
          // sourceMap: "web.min.js.map",
          report: "min",
        },
      }
    },
  });

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks("grunt-contrib-jshint");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-simple-mocha");
  grunt.loadNpmTasks("grunt-literate");
  grunt.loadNpmTasks("grunt-browserify");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-less");

  // Default task.
  grunt.registerTask("default", ["jshint", "simplemocha"]);
};
