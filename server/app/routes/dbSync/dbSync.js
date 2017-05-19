var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Follower = mongoose.model('Follower');
var TrackedUser = mongoose.model('TrackedUser');
var DownloadTrack = mongoose.model('DownloadTrack');
var User = mongoose.model('User');
var PaidRepostAccount = mongoose.model('PaidRepostAccount');
var RepostEvent = mongoose.model('RepostEvent');
var Channel = mongoose.model('Channel');
var NetworkAccounts = mongoose.model('NetworkAccounts');
var Submission = mongoose.model('Submission');
var rootURL = require('./../../../env').ROOTURL;

router.put('/updateRepostSettings', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var repostSettings = req.body.repostSettings;
  User.findOneAndUpdate({
      '_id': req.body.id
    }, {
      $set: {
        repostSettings: repostSettings
      }
    }, {
      new: true
    })
    .then(function(result) {
      res.send(result);
    })
    .then(null, function(err) {
      next(err);
    });
});

router.get('/updateAllDefaults', function(req, res, next) {
  User.find({})
    .then(function(users) {
      users.forEach(function(user) {
        for (var name in user.availableSlots) {
          var newAvSlots = [];
          user.availableSlots[name].forEach(function(hour) {
            if (!newAvSlots.includes(hour)) newAvSlots.push(hour);
          })
          user.availableSlots[name] = newAvSlots;
        }
        if (user.repostSettings.poolOn == undefined) user.repostSettings.poolOn = true;
        User.findByIdAndUpdate(user._id, user, {
            new: true
          })
          .then(null, null)
      })
      return RepostEvent.find({})
    })
    .then(function(repEvents) {
      repEvents.forEach(function(repEvent) {
        repEvent.save();
      })
      res.send('ok')
    })
    .then(null, next);
})

router.get('/updateSubs/:post', function(req, res, next) {
  if (req.params.post == 'subs') {
    Submission.find({})
      .then(function(submissions) {
        submissions.forEach(function(sub) {
          sub.save();
        });
        res.send('ok');
      })
  } else {
    next(new Error('wrong code'));
  }
})

router.get('/updatePseudonames', function(req, res, next) {
  User.find({})
    .then(function(users) {
      users.forEach(function(user) {
        if (user.soundcloud && user.soundcloud.permalinkURL) {
          var pseudoname = user.soundcloud.permalinkURL.substring(user.soundcloud.permalinkURL.indexOf('.com/') + 5)
          user.soundcloud.pseudoname = pseudoname;
          user.save();
        }
      })
      return RepostEvent.find({})
    })
    .then(function(events) {
      events.forEach(function(event) {
        if (event.trackURL) {
          var pseudoname = event.trackURL.substring(event.trackURL.indexOf('.com/') + 5)
          pseudoname = pseudoname.substring(pseudoname.indexOf('/') + 1)
          event.pseudoname = pseudoname;
          event.save()
        }
      });
      return DownloadTrack.find({})
    })
    .then(function(dltracks) {
      dltracks.forEach(function(dltrack) {
        dltrack.pseudoname = dltrack.artistUsername.replace(/[^a-zàèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœA-Z0-9 ]/g, "").replace(/ /g, "_") + "/" + dltrack.trackTitle.replace(/[^a-zàèìòùÀÈÌÒÙáéíóúýÁÉÍÓÚÝâêîôûÂÊÎÔÛãñõÃÑÕäëïöüÿÄËÏÖÜŸçÇßØøÅåÆæœA-Z0-9 ]/g, "").replace(/ /g, "_");
        dltrack.trackDownloadUrl = rootURL + "/download/" + dltrack.pseudoname;
        dltrack.save();
      })
      res.send('ok');
    }).then(null, next);
})