const { debug } = require('netrisse-lib');

module.exports = function(e) {
  if (e) {
    debug(e);
    console.error(e);
  }
};
