'use strict';
var mongoose = require('mongoose');
var User = mongoose.model('User');
var RepostEvent = mongoose.model('RepostEvent');
var scWrapper = require("../../SCWrapper/SCWrapper.js");
var scConfig = require('./../../../env').SOUNDCLOUD;
var sendEmail = require('../../mandrill/sendEmail.js');
var request = require('request');
var Trade = mongoose.model('Trade');
var notificationCenter = require('../../notificationCenter/notificationCenter.js');


scWrapper.init({
  id: scConfig.clientID,
  secret: scConfig.clientSecret,
  uri: scConfig.redirectURL
});

module.exports = doUnrepost;
//executes every hour
function doUnrepost() {
  setTimeout(function() {
    doUnrepost();
  }, 3600000);

  var lowerDate = new Date();
  lowerDate.setTime(lowerDate.getTime() - lowerDate.getMinutes(0) * 60 * 1000 - lowerDate.getMinutes(0) * 1000);
  var upperDate = new Date();
  upperDate.setTime(upperDate.getTime() + 60 * 60 * 1000 - upperDate.getMinutes(0) * 60 * 1000 - upperDate.getMinutes(0) * 1000);

  RepostEvent.find({
      completed: true,
      unrepostDate: {
        $gt: lowerDate,
        $lt: upperDate
      }
    })
    .then(function(events) {
      events.forEach(function(event) {
        User.findOne({
            'soundcloud.id': event.userID
          })
          .then(function(user) {
            if (user) unrepostEvent(event, user);
          })
          .then(null, function(err) {
            console.log(err);
          })
      });
    })
    .then(null, function(err) {
      console.log(err);
    });
}

function unrepostEvent(event, user) {
  scWrapper.setToken(user.soundcloud.token);
  var reqObj = {
    method: 'DELETE',
    path: '/e1/me/track_reposts/' + event.trackID,
    qs: {
      oauth_token: user.soundcloud.token
    }
  };
  scWrapper.request(reqObj, function(err, data) {
    if (!err) {
      // putMessage(event, user);
      notificationCenter.sendNotification(user._id, 'trackUnrepost', 'Track unrepost', event.title + ' was unreposted from ' + user.soundcloud.username + '.', 'https://artistsunlimited.co/login');
    }
  });
}

// /*Update Message*/
// function putMessage(event, user) {
//   var query = {
//     $or: [{
//       'p1.user': event.owner,
//       'p2.user': user._id
//     }, {
//       'p2.user': event.owner,
//       'p1.user': user._id
//     }]
//   };
//   var message = {
//     type: 'alert',
//     text: 'A track was unreposted on ' + user.soundcloud.username,
//     senderId: event.owner,
//     date: new Date()
//   };
//   Trade.update(query, {
//       $addToSet: {
//         messages: message
//       }
//     })
//     
//     .then(function(data) {
//       //Success
//     })
//     .then(null, function(error) {
//       console.log(error);
//     });
// }