var emitter = require('./emitter');
module.exports = function (io) {
  emitter.on('notification', function (data) {
    io.emit('notification', data);
  });
};
