require('./autoReposter.js')();
setTimeout(function() {
  require('./autoUnreposter.js')();
}, 60000);
setTimeout(function() {
  require('./reminderMessage.js')();
}, 2 * 60000);
setTimeout(function() {
  require('./refundSender.js')();
}, 3 * 60000);
setTimeout(function() {
  require('./autoPoolSender.js')();
}, 4 * 60000);
setTimeout(function() {
  require('./cleanMarketPlace.js')();
}, 5 * 60000);
setTimeout(function() {
  require('./autoAccessTokenChecker.js')();
}, 6 * 60000);
