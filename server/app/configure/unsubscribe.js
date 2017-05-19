var mongoose = require('mongoose');
var Follower = mongoose.model('Follower');
var env = require('./../../env');

module.exports = unsubscribe;

function unsubscribe(req, res) {
  var followerId = req.params.followerId;
  Follower
    .findByIdAndUpdate(followerId, {
      emailDayNum: 0
    })
    .then(function(channel) {
      res.send('<p>You have been unsubscribed successfully.</p><a href=' + env.HOST_URI + '>Home</a>');
    });
}