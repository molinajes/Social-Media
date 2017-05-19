var EventEmitter = require('events').EventEmitter;
var util = require('util');

function Emitter() {
  EventEmitter.call(this);
}
util.inherits(Emitter, EventEmitter);

var emitter = new Emitter();

emitter.notification = function (data) {
  emitter.emit('notification', data);
}

module.exports = emitter;