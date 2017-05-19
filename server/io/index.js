'use strict';
module.exports = function(io) {

  /*Include trade*/
  require('./trade/trade.js')(io);

};