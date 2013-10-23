// Usage: node detectnestedternary.js /path/to/some/directory
// Adopted from http://esprima.org/doc/#nestedternary
// Compare to https://raw.github.com/ariya/esprima/master/examples/detectnestedternary.js

var fs = require("fs");
var esprima = require("esprima");
var dirname = process.argv[2];
var jsstana = require("../lib/jsstana.js");

// http://stackoverflow.com/q/5827612/
function walk(dir, done) {
    var results = [];
    fs.readdir(dir, function (err, list) {
        if (err) {
            return done(err);
        }
        var i = 0;
        (function next() {
            var file = list[i++];
            if (!file) {
                return done(null, results);
            }
            file = dir + '/' + file;
            fs.stat(file, function (err, stat) {
                if (stat && stat.isDirectory()) {
                    walk(file, function (err, res) {
                        results = results.concat(res);
                        next();
                    });
                } else {
                    results.push(file);
                    next();
                }
            });
        }());
    });
}

// Create matchers out of the loops
var nestedMatcherCon = jsstana.pattern("(ternary ?cond (ternary))");
var nestedMatcherAlt = jsstana.pattern("(ternary ?cond ? (ternary))");

walk(dirname, function (err, results) {
    if (err) {
        console.log('Error', err);
        return;
    }

    results.forEach(function (filename) {
        var shortname, first, content, syntax;

        shortname = filename;
        first = true;

        if (shortname.substr(0, dirname.length) === dirname) {
            shortname = shortname.substr(dirname.length + 1, shortname.length);
        }

        function report(node, problem) {
            if (first === true) {
                console.log(shortname + ': ');
                first = false;
            }
            console.log('  Line', node.loc.start.line, ':', problem);
        }

        function checkConditional(node, match) {
            var condition;

            if (match) {
                condition = content.substring(match.cond.range[0], match.cond.range[1]);
                if (condition.length > 20) {
                    condition = condition.substring(0, 20) + '...';
                }
                condition = '"' + condition + '"';
                report(node, "Nested ternary for " + condition);
            }
        }

        try {
            content = fs.readFileSync(filename, 'utf-8');
            syntax = esprima.parse(content, { tolerant: true, loc: true, range: true });
            jsstana.traverse(syntax, function (node) {
                var m, condition;

                checkConditional(node, nestedMatcherCon(node));
                checkConditional(node, nestedMatcherAlt(node));
            });
        } catch (e) {
        }

    });
});