var mongoose = require('mongoose');
var User = mongoose.model('User');
var messengerAPI = require('../../messengerAPI/messengerAPI.js');


module.exports = sendReminder;
//every hour
function sendReminder() {

  setTimeout(function() {
    sendReminder();
  }, 3600000);
  User.find({
    'notificationSettings.facebookMessenger.lastMessageDate': {
      $lt: (new Date()).getTime() - 24 * 3600000,
      $gt: (new Date()).getTime() - 25 * 3600000
    }
  }).then(function(users) {
    var messagedUsers = [];
    users.forEach(function(user) {
      if (!messagedUsers.includes(user.notificationSettings.facebookMessenger.messengerID)) {
        setTimeout(function() {
          messengerAPI.quickReplies(user.notificationSettings.facebookMessenger.messengerID, 'Hey, would you like to receive notifications for the next 24 hours?', [{
            content_type: "text",
            title: "Yes",
            payload: "OPTIN YES"
          }]);
        }, 4000)
        messagedUsers.push(user.notificationSettings.facebookMessenger.messengerID);
      }
    });
  }).then(null, console.log);
}