var mongoose = require('mongoose');
var User = mongoose.model('User');
var RepostEvent = mongoose.model('RepostEvent');
var sendEmail = require('../../mandrill/sendEmail.js');
var scWrapper = require("../../SCWrapper/SCWrapper.js");
var scConfig = require('./../../../env').SOUNDCLOUD;
var notificationCenter = require('../../notificationCenter/notificationCenter.js');
scWrapper.init({
  id: scConfig.clientID,
  secret: scConfig.clientSecret,
  uri: scConfig.redirectURL
});

module.exports = checkTokens;

//every 2 hours
function checkTokens() {
  setTimeout(function() {
    checkTokens()
  }, 2 * 3600000);

  User.find({
      email: {
        $ne: null
      }
    })
    .then(function(users) {
      users.forEach(function(user) {
        RepostEvent.findOne({
            userID: user.soundcloud.id,
            completed: false,
            day: {
              $gt: new Date()
            }
          })
          .then(function(event) {
            if (event) {
              scWrapper.setToken(user.soundcloud.token);
              var reqObj = {
                method: 'GET',
                path: '/me',
                qs: {}
              };
              scWrapper.request(reqObj, function(err, data) {
                if (err) {
                  notificationCenter.sendNotifications(user._id, "accessToken", "Bad Access Token", "Hello " + user.soundcloud.username + ", We need you to log back into Artists Unlimited to be able to complete your upcoming reposts! FYI this happens when you change your password on Soundcloud. Remember to LOG IN WITH " + user.soundcloud.username.toUpperCase(), "https://artistsunlimited.com/login");
                }
              });
            }
          })
      });
    });
}
