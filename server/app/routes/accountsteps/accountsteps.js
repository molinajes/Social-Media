'use strict';
var scConfig = global.env.SOUNDCLOUD;
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Submission = mongoose.model('Submission');
var Channel = mongoose.model('Channel');
var User = mongoose.model('User');
var RepostEvent = mongoose.model('RepostEvent');
var Email = mongoose.model('Email');
var rootURL = require('../../../env').ROOTURL;
var Promise = require('promise');
var scConfig = global.env.SOUNDCLOUD;
var sendEmail = require("../../mandrill/sendEmail.js"); //takes: to_name, to_email, from_name, from_email, subject, message_html
var paypalCalls = require("../../payPal/paypalCalls.js");
var scWrapper = require("../../SCWrapper/SCWrapper.js");
scWrapper.init({
  id: scConfig.clientID,
  secret: scConfig.clientSecret,
  uri: scConfig.redirectURL
});
router.post('/sendVarificationAccount', function(req, res, next) {
  paypalCalls.sendPayout(req.body.email, req.body.price, "Verification trial amount.", "N/A")
    .then(function(payout) {
      res.send(payout);
    }).then(null, next);
})

router.post('/sendTestEmail', function(req, res, next) {
  var toEmail = req.body.email;
  var body = formatForTestEmail(req.body.emailObj.body, toEmail);
  var subject = formatForTestEmail(req.body.emailObj.subject, toEmail);
  var emailBody = '<table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:0"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr><td><table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:url(' + 'https://artistsunlimited.com' + '/assets/images/fade-background.png) no-repeat;color:white;background-size:cover;background-position:center;"><tr><td align="left" style="padding:20px" width="50%"><a href="https://artistsunlimited.com"><img src="' + 'https://artistsunlimited.com' + '/assets/images/logo-white.png" height="45" style="height:45px" alt="AU"/></a></td><td align="right" style="font-size:22px;color:white;font-weight:bold;padding:20px" width="50%">Artists <br/>Unlimited</td></tr><tr><td colspan="2" align="center" style="padding:40px 0 30px 0;font-size:28px;font-weight:bold;font-family:Arial,sans-serif;color:white"><h2>' + 'Your Submission Was Accepted' + '</h2></td></tr></table></td></tr><tr><td bgcolor="#ffffff" style="padding:40px 30px 40px 30px"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="color:#153643;font-family:Arial,sans-serif;">' + body + '</td></tr></table></td></tr><tr><td align="center" width="100%" style="padding:30px 30px 50px 30px"><a href="" style="background-color:#f5bbbc;border:transparent;border-radius:0;padding:14px 50px;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:3px;text-decoration:none;margin:30px 0;" class="btn btn-enter">Get promoted</a></td></tr><tr><td align="center" width="100%" style="padding:30px 30px 50px 30px"><a href="' + rootURL + '/login" style="color:#f5d3b5">Artist Tools</a></td></tr></table></td></tr></table></td></tr></table>';
  sendEmail("Johnny Submitter", toEmail, "Artists Unlimited", "coayscue@artistsunlimited.com", subject, emailBody);
  res.send({
    success: true
  });
});

function formatForTestEmail(item, email) {
  return item.replace(/{TRACK_TITLE_WITH_LINK}/g, "<a href='https://soundcloud.com/olivernelson/oliver-nelson-ft-kaleem-taylor-aint-a-thing-3'>Oliver Nelson ft. Kaleem Taylor - Ain't A Thing</a>").replace(/{TRACK_TITLE}/g, "Oliver Nelson ft. Kaleem Taylor - Ain't A Thing").replace(/{SUBMITTERS_EMAIL}/g, email).replace(/{SUBMITTERS_NAME}/g, "Johnny Submitter").replace(/{TRACK_ARTIST_WITH_LINK}/g, "<a href='https://soundcloud.com/olivernelson'>Oliver Nelson</a>").replace(/{TRACK_ARTIST}/g, "Oliver Nelson").replace(/{SUBMITTED_TO_ACCOUNT_NAME}/g, "La Tropical").replace(/{SUBMITTED_ACCOUNT_NAME_WITH_LINK}/g, "<a href='https://soundcloud.com/latropical'>La Tropical</a>").replace(/{SUBMITTED_TO_ACCOUNT_NAME_WITH_LINK}/g, "<a href='https://soundcloud.com/latropical'>La Tropical</a>").replace(/{TRACK_ARTWORK}/g, "<img style='width:200px; height: 200px' src='https://i1.sndcdn.com/artworks-000182530607-7nuozs-t300x300.jpg'></img>").replace(/{ACCEPTED_CHANNEL_LIST}/g, "La Tropical, Etiquette Noir, and Le Sol").replace(/{ACCEPTED_CHANNEL_LIST_WITH_LINK}/g, "<a href='https://soundcloud.com/latropical'>La Tropical</a>, <a href='https://soundcloud.com/etiquettenoir'>Etiquette Noir</a>, and <a href='https://soundcloud.com/lesolmusique'>Le Sol</a>").replace(/{TODAYSDATE}/g, new Date().toLocaleDateString()).replace(/\n/g, "<br>");
}
