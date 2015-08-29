/* global describe:true, it:true */
"use strict";

var utils = require("../lib/utils.js");
var jsc = require("jsverify");
var chai = require("chai");

function normalize(partition) {
  return partition.slice().sort();
}

function factorial(n) {
  if (n <= 1) {
    return 1;
  } else {
    return n * factorial(n - 1);
  }
}

function binomialCoefficient(n, k) {
  return factorial(n) / (factorial(k) * factorial(n - k));
}

describe("partitions", function () {
  it("example 1", function () {
    var result = utils.partitions(3, 1);
    chai.expect(result).to.deep.equal([[3]]);
  });

  it("example 2", function () {
    var result = utils.partitions(3, 2);
    chai.expect(normalize(result)).to.deep.equal(normalize([
      [3, 0],
      [2, 1],
      [1, 2],
      [0, 3],
    ]));
  });

  it("example 3", function () {
    var result = utils.partitions(3, 3);
    chai.expect(normalize(result)).to.deep.equal(normalize([
      [0, 0, 3],
      [0, 1, 2],
      [0, 2, 1],
      [0, 3, 0],
      [1, 0, 2],
      [1, 1, 1],
      [1, 2, 0],
      [2, 0, 1],
      [2, 1, 0],
      [3, 0, 0],
    ]));
  });

  var genN = "nat 7";
  var genM = "nat 6";

  jsc.property("partitions are of right size", genN, genM, function (n, m) {
    m += 1;
    var result = utils.partitions(n, m);
    return result.every(function (p) {
      return p.length === m;
    });
  });

  jsc.property("partitions add to size", genN, genM, function (n, m) {
    m += 1;
    var result = utils.partitions(n, m);
    return result.every(function (p) {
      return n === p.reduce(function (a, b) { return a + b; }, 0);
    });
  });

  jsc.property("there are all partitions", genN, genM, function (n, m) {
    m += 1;
    // console.log(n, m, binomialCoefficient(m + n - 1, n));
    var result = utils.partitions(n, m);
    return result.length === binomialCoefficient(m + n - 1, n);
  });
});

describe("some", function () {
  var or = function (a, b) {
    return a || b;
  };

  jsc.property("same as arr.map(f).reduce(or, undefined)", "array nat", "nat -> bool | nat 2", function (arr, f) {
    var a = utils.some(arr, f);
    var b = arr.map(f).reduce(or, undefined);
    return a === b;
  });
});
