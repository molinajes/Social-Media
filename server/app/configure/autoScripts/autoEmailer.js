var sendEmail = require('../../mandrill/sendEmail.js');
var mongoose = require('mongoose');
var Follower = mongoose.model('Follower');
var EmailTemplate = mongoose.model('EmailTemplate')
var objectAssign = require('object-assign');
var env = require('./../../../env');
module.exports = function() {
  setTimeout(function() {
    sendAutoEmails;
  }, 86400000);
}

//daily emails
function sendAutoEmails() {
  setTimeout(function() {
    sendAutoEmails()
  }, 86400000);

  var now = new Date();
  var start = new Date(now.getFullYear(), 0, 0);
  var diff = now - start;
  var oneDay = 1000 * 60 * 60 * 24;
  var day = Math.floor(diff / oneDay);
  var dayNum = (day % 14) + 1;

  EmailTemplate.findOne({
    purpose: "Biweekly Email",
    isSendEmail: true
  }).then(function(template) {
    if (template) {
      var isArtist = template.isArtist;
      var filter = {
        emailDayNum: dayNum,
        artist: isArtist
      };
      Follower.find(filter)
        .then(function(followers) {
          followers.forEach(function(follower) {
            var templateObj = objectAssign({}, template.toObject());
            templateObj.htmlMessage = templateObj.htmlMessage.replace(/{Unsubscribe}/, '<a href="' + env.HOST_URI + '/unsubscribe/' + follower._id + '">' + 'Unsubscribe' + '</a>');
            follower.allEmails.forEach(function(emailAddress) {
              sendEmail(follower.username, emailAddress, templateObj.fromName, templateObj.fromEmail, templateObj.subject, templateObj.htmlMessage);
            });
          });
        });

      if (template.reminderDay == dayNum) {
        sendEmail(template.fromName, template.fromEmail, "Email Server", "coayscue@artistsunlimited.com", "Reminder to Change Biweekly Email", "Hey " + template.fromName + ", <br><br>You haven 't changed the bi-weekly email in 2 weeks. <br><br>Sincerely,<br>Your Biweekly Email Server");
      }
    }
  });
}