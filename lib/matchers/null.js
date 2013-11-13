"use strict";

 /**
  #### (null-node)

  Matches `undefined` node.
*/
function nullNodeMatcher() {
  /* jshint validthis:true */
  var that = this;
  that.assertArguments("null-node", 0, arguments);

  return function (node) {
    return node === null ? {} : undefined;
  };
}

module.exports = {
  "null-node": nullNodeMatcher,
};
