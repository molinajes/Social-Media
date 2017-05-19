var mongoose = require('mongoose');
var Submission = mongoose.model('Submission');
var sendEmail = require('../../mandrill/sendEmail.js');
var rootURL = require('../../../env').ROOTURL;

module.exports = doPoolSent;
//executes every 5 min
function doPoolSent() {
  setTimeout(function() {
    doPoolSent();
  }, 300000);

  var currentDate = new Date();
  Submission.find({
      pooledSendDate: {
        $lte: currentDate,
        $gt: new Date(25 * 3600000)
      },
      status: 'pooled'
    })
    .populate('userID')
    .then(function(submissions) {
      submissions.forEach(function(sub) {
        Submission.findByIdAndUpdate(sub._id, {
            status: 'poolSent'
          })
          .then(function(sub) {
            if (sub.email && sub.name && sub.pooledChannelIDS.length > 0) {
              sendMessage(sub);
            }
          }, console.log)
      })
    })
    .then(null, function(err) {
      console.log(err);
    });
}

function sendMessage(sub) {
  if (sub.email && sub.name) {
    var emailBody = '<table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:0"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr><td><table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:url(' + 'https://artistsunlimited.com' + '/assets/images/fade-background.png) no-repeat;color:white;background-size:cover;background-position:center;"><tr><td align="left" style="padding:20px" width="50%"><a href="https://artistsunlimited.com"><img src="' + 'https://artistsunlimited.com' + '/assets/images/logo-white.png" height="45" style="height:45px" alt="AU"/></a></td><td align="right" style="font-size:22px;color:white;font-weight:bold;padding:20px" width="50%">Artists <br/>Unlimited</td></tr><tr><td colspan="2" align="center" style="padding:40px 0 30px 0;font-size:28px;font-weight:bold;font-family:Arial,sans-serif;color:white"><h2>' + 'Your submissions was accepeted' + '</h2></td></tr></table></td></tr><tr><td bgcolor="#ffffff" style="padding:40px 30px 40px 30px"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="color:#153643;font-family:Arial,sans-serif;">' + "More channels accepted your track " + '<a href="' + sub.trackURL + '">' + sub.title + '</a>' + " for repost. Click the button bellow to check them out!" + '</td></tr></table></td></tr><tr><td align="center" width="100%" style="padding:30px 30px 50px 30px"><a href="' + rootURL + '/pay/' + sub._id + '" style="background-color:#f5bbbc;border:transparent;border-radius:0;padding:14px 50px;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:3px;text-decoration:none;margin:30px 0;" class="btn btn-enter">Get promoted</a></td></tr><tr><td align="center" width="100%" style="padding:30px 30px 50px 30px"><a href="' + rootURL + '/login" style="color:#f5d3b5">Log In</a></td></tr></table></td></tr></table></td></tr></table>';
    sendEmail(sub.name, sub.email, "Artists Unlimited", "coayscue@artistsunlimited.com", 'Your submission was accepted', emailBody);
  }
}
