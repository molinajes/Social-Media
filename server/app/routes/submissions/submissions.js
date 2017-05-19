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
var PremiereSubmission = mongoose.model('PremierSubmission');
var Promise = require('promise');
var scConfig = global.env.SOUNDCLOUD;
var sendEmail = require("../../mandrill/sendEmail.js"); //takes: to_name, to_email, from_name, from_email, subject, message_html
var paypalCalls = require("../../payPal/paypalCalls.js");
var scheduleRepost = require("../../scheduleRepost/scheduleRepost.js");
var scWrapper = require("../../SCWrapper/SCWrapper.js");
scWrapper.init({
  id: scConfig.clientID,
  secret: scConfig.clientSecret,
  uri: scConfig.redirectURL
});

router.post('/', function(req, res, next) {
  User.findOne({
      'paidRepost.userID': req.body.userID
    })
    .then(function(adminUser) {
      if (adminUser) {
        var paidRepostIds = [];
        if (adminUser.paidRepost.length > 0) {
          adminUser.paidRepost.forEach(function(acc) {
            paidRepostIds.push(acc.userID);
          })
        }
        return Submission.findOne({
          trackID: req.body.trackID,
          userID: {
            $in: paidRepostIds
          },
          submissionDate: {
            $gt: new Date().getTime() - 48 * 3600000
          }
        })
      } else {
        throw new Error("Could not find admin user.")
      }
    }).then(function(sub) {
      if (sub) {
        throw new Error("You have already submitted this track to this admin in the last 48 hours. Please wait to hear back.")
      } else {
        var submission = new Submission(req.body);
        submission.submissionDate = new Date();
        return submission.save()
      }
    }).then(function(sub) {
      res.send(sub);
    }).then(null, next);
});

router.post('/pool', function(req, res, next) {
  Submission.findOne({
    trackID: req.body.trackID,
    poolSendDate: {
      $gt: new Date().getTime() - 48 * 3600000
    }
  }).then(function(sub) {
    if (sub) {
      throw new Error("This track is already submitted to all merchants and is being reviewed.")
    } else {
      console.log(req.body);
      var submission = new Submission(req.body);
      submission.submissionDate = new Date();
      submission.status = "pooled";
      submission.pooledSendDate = new Date((new Date()).getTime() + 72 * 3600000);
      return submission.save()
    }
  }).then(function(sub) {
    res.send(sub);
  }).then(null, next);
})

router.get('/unaccepted', function(req, res, next) {
  if (!req.user.role == 'admin' || !req.user.role == 'superadmin') {
    next(new Error('Unauthoirized'));
    return;
  } else {
    var resultSubs = [];
    var skipcount = parseInt(req.query.skip);
    var limitcount = parseInt(req.query.limit);
    var genre = req.query.genre ? req.query.genre : undefined;
    var paidRepostIds = [];
    if (req.query.userID != "all") {
      paidRepostIds.push(req.query.userID);
    } else if (req.user.paidRepost.length > 0) {
      req.user.paidRepost.forEach(function(acc) {
        paidRepostIds.push(acc.userID);
      })
    }
    var query = {
      channelIDS: [],
      userID: {
        $in: paidRepostIds
      },
      ignoredBy: {
        $ne: req.user._id.toJSON()
      },
      status: "submitted"
    };
    if (genre != undefined && genre != 'null' && genre != 'all') {
      query.genre = genre;
    }
    Submission.find(query).sort({
        submissionDate: 1
      })
      .populate('userID')
      .skip(skipcount)
      .limit(limitcount)
      .then(function(subs) {
        var i = -1;
        var cont = function() {
          i++;
          if (i < subs.length) {
            var sub = subs[i].toJSON();
            sub.approvedChannels = [];
            Submission.find({
                email: sub.email
              })
              .then(function(oldSubs) {
                oldSubs.forEach(function(oldSub) {
                  oldSub.paidChannels.forEach(function(pc) {
                    sub.approvedChannels.push(pc.user.id)
                  })
                });
                resultSubs.push(sub);
                cont();
              })
              .then(null, next);
          } else {
            res.send(resultSubs);
          }
        }
        cont();
      })
      .then(null, next);
  }
});

router.get('/getMarketPlaceSubmission', function(req, res, next) {
  if (!req.user.role == 'admin' || !req.user.role == 'superadmin') {
    next(new Error('Unauthoirized'));
    return;
  } else {
    var resultSubs = [];
    var skipcount = parseInt(req.query.skip);
    var limitcount = parseInt(req.query.limit);
    var genre = req.query.genre ? req.query.genre : undefined;
    var paidRepostIds = [];
    if (req.user.paidRepost.length > 0) {
      req.user.paidRepost.forEach(function(acc) {
        paidRepostIds.push(acc.userID);
      })
    }
    var query = {
      pooledSendDate: {
        $gt: new Date()
      },
      ignoredBy: {
        $ne: req.user._id.toJSON()
      },
      status: "pooled"
    };
    if (genre != undefined && genre != 'null' && genre != 'all') {
      query.genre = genre;
    }
    Submission.find(query).sort({
        pooledSendDate: 1
      })
      .populate('userID')
      .skip(skipcount)
      .limit(limitcount)
      .then(function(subs) {
        var i = -1;
        var cont = function() {
          i++;
          if (i < subs.length) {
            var sub = subs[i].toJSON();
            sub.approvedChannels = [];
            Submission.find({
                email: sub.email
              })
              .then(function(oldSubs) {
                oldSubs.forEach(function(oldSub) {
                  oldSub.paidChannels.forEach(function(chan) {
                    sub.approvedChannels.push(chan.user.id);
                  })
                  oldSub.paidPooledChannels.forEach(function(chan) {
                    sub.approvedChannels.push(chan.user.id);
                  })
                });
                resultSubs.push(sub);
                cont();
              })
              .then(null, next);
          } else {
            res.send(resultSubs);
          }
        }
        cont();
      })
      .then(null, next);
  }
});

router.get('/counts', function(req, res, next) {
  function getCount(user) {
    var paidRepostIds = [];
    if (user.paidRepost.length > 0) {
      user.paidRepost.forEach(function(acc) {
        paidRepostIds.push(acc.userID);
      })
    }
    var query = {
      channelIDS: [],
      userID: {
        $in: paidRepostIds
      },
      ignoredBy: {
        $ne: user._id.toJSON()
      },
      status: "submitted"
    };
    var resObj = {};
    Submission.count(query, function(err, count) {
      if (!err) {
        resObj.regularCount = count;
        var paidRepostIds = [];
        if (user.paidRepost.length > 0) {
          user.paidRepost.forEach(function(acc) {
            paidRepostIds.push(acc.userID);
          })
        }
        var query = {
          pooledSendDate: {
            $gt: new Date()
          },
          ignoredBy: {
            $ne: user._id.toJSON()
          },
          status: "pooled"
        }
        Submission.count(query, function(err, countMarket) {
          if (!err) {
            resObj.marketCount = countMarket;
            res.send(resObj);
          } else {
            next(err);
          }
        })
      } else {
        next(err);
      }
    });
  }
  if (req.user.role != 'admin') {
    User.findOne({
        'paidRepost.userID': req.user._id
      })
      .then(function(adminUser) {
        if (adminUser) getCount(adminUser);
        else(next(new Error('user not found')));
      }).then(null, next)
  } else {
    getCount(req.user);
  }
})

router.get('/getUnacceptedSubmissions', function(req, res, next) {
  if (req.user) {
    var query = {
      channelIDS: [],
      userID: req.user._id,
      ignoredBy: {
        $ne: req.user._id.toJSON()
      }
    };
    Submission.count(query)
      .then(function(subs) {
        return res.json(subs)
      })
      .then(0, next);
  } else {
    res.json([]);
  }
});


router.get('/getGroupedSubmissions', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  Submission.aggregate({
      $match: {
        channelIDS: [],
        userID: req.user._id
      }
    }, {
      $group: {
        _id: '$genre',
        total_count: {
          $sum: 1
        }
      }
    })
    .then(function(subs) {
      return res.json(subs)
    })
    .then(0, next);
});

router.get('/getPaidRepostAccounts', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var accPromArray = [];
  var results = [];
  req.user.paidRepost.forEach(function(pr) {
    var pr = pr.toJSON();
    accPromArray.push(User.findOne({
        _id: pr.userID
      }).then(function(u) {
        if (u) {
          pr.user = u.soundcloud;
          return new Promise(function(resolve, reject) {
            scWrapper.setToken(pr.user.token);
            var reqObj = {
              method: 'GET',
              path: '/me',
              qs: {}
            };
            scWrapper.request(reqObj, function(err, data) {
              if (pr.linkInBio == undefined && data) pr.linkInBio = JSON.stringify(data).includes('artistsunlimited');
              resolve(pr);
            })
          })
        }
      })
      .then(function(newPr) {
        if (newPr) {
          results.push(pr);
        }
      }))
  });
  Promise.all(accPromArray)
    .then(function(arr) {
      res.send(results);
    }).then(null, next);
});

router.get('/getAccountsByIndex/:user_id', function(req, res) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var user_id = req.params.user_id;
  var results = [];
  var paidRepost = req.user.paidRepost.find(function(pr) {
    return pr.userID == user_id;
  });
  var accounts = paidRepost.toJSON();
  User.findOne({
    _id: user_id
  }, function(e, u) {
    if (u) {
      accounts.user = u.soundcloud;
      res.send(accounts);
    }
  });
});

router.put('/save', function(req, res, next) {
  if (!req.user || req.user.role != 'admin') {
    next(new Error('Unauthorized'));
    return;
  } else {
    if (req.body.status == "pooled") {
      req.body.ignoredBy.push(req.user._id.toJSON());
      Submission.findByIdAndUpdate(req.body._id, req.body, {
          new: true
        })
        .then(function(sub) {
          res.send(sub)
        })
        .then(null, next);
    } else {
      req.body.status = "pooled";
      req.body.pooledSendDate = new Date((new Date()).getTime() + 72 * 3600000);
      req.body.ignoredBy = [req.user._id.toJSON()];
      Submission.findByIdAndUpdate(req.body._id, req.body, {
          new: true
        })
        .populate("userID")
        .then(function(sub) {
          User.find({
              'soundcloud.id': {
                $in: sub.channelIDS
              }
            })
            .then(function(channels) {
              var nameString = "";
              var nameStringWithLink = "";
              channels.forEach(function(cha, index) {
                var addString = cha.soundcloud.username;
                var addStringWithLink = "<a href='" + cha.soundcloud.permalinkURL + "'>" + cha.soundcloud.username + "</a>";
                if (index == channels.length - 1) {
                  if (channels.length > 1) {
                    addString = "and " + addString;
                    addStringWithLink = "and " + addStringWithLink;
                  }
                } else {
                  addStringWithLink += ", ";
                  addString += ", ";
                }
                nameStringWithLink += addStringWithLink;
                nameString += addString;
              });
              sub.nameString = nameString;
              sub.nameStringWithLink = nameStringWithLink;
              var acceptEmail = {};
              if (req.user.repostCustomizeEmails && req.user.repostCustomizeEmails.length > 0) {
                acceptEmail = req.user.repostCustomizeEmails[0].acceptance;
              }
              var body = formatForEmail(acceptEmail.body, sub);
              var subject = formatForEmail(acceptEmail.subject, sub);
              var emailBody = '<table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="padding:0"><table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr><td><table border="0" cellpadding="0" cellspacing="0" width="100%" style="background:url(' + 'https://artistsunlimited.com' + '/assets/images/fade-background.png) no-repeat;color:white;background-size:cover;background-position:center;"><tr><td align="left" style="padding:20px" width="50%"><a href="https://artistsunlimited.com"><img src="' + 'https://artistsunlimited.com' + '/assets/images/logo-white.png" height="45" style="height:45px" alt="AU"/></a></td><td align="right" style="font-size:22px;color:white;font-weight:bold;padding:20px" width="50%">Artists <br/>Unlimited</td></tr><tr><td colspan="2" align="center" style="padding:40px 0 30px 0;font-size:28px;font-weight:bold;font-family:Arial,sans-serif;color:white"><h2>' + 'Your Submission Was Accepted' + '</h2></td></tr></table></td></tr><tr><td bgcolor="#ffffff" style="padding:40px 30px 40px 30px"><table border="0" cellpadding="0" cellspacing="0" width="100%"><tr><td style="color:#153643;font-family:Arial,sans-serif;">' + body + '</td></tr></table></td></tr><tr><td align="center" width="100%" style="padding:30px 30px 50px 30px"><a href="' + rootURL + '/pay/' + sub._id + '" style="background-color:#f5bbbc;border:transparent;border-radius:0;padding:14px 50px;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:3px;text-decoration:none;margin:30px 0;" class="btn btn-enter">Get promoted</a></td></tr><tr><td align="center" width="100%" style="padding:30px 30px 50px 30px"><a href="' + rootURL + '/login" style="color:#f5d3b5">Log In</a></td></tr></table></td></tr></table></td></tr></table>';
              sendEmail(sub.name, sub.email, "Artists Unlimited", "coayscue@artistsunlimited.com", subject, emailBody);
              res.send(sub);
            }).then(null, next);
        })
        .then(null, next);
    }
  }
});

function formatForEmail(item, sub) {
  return item.replace('{TRACK_TITLE_WITH_LINK}', '<a href="' + sub.trackURL + '">' + sub.title + '</a>').replace('{TRACK_TITLE}', sub.title).replace('{SUBMITTERS_EMAIL}', sub.email).replace('{SUBMITTERS_NAME}', sub.name).replace('{TRACK_ARTIST_WITH_LINK}', '<a href="' + sub.trackArtistURL + '">' + sub.trackArtist + '</a>').replace('{TRACK_ARTIST}', sub.trackArtist).replace('{SUBMITTED_TO_ACCOUNT_NAME}', sub.userID.soundcloud.username).replace('{SUBMITTED_ACCOUNT_NAME_WITH_LINK}', '<a href="' + sub.userID.soundcloud.permalinkURL + '">' + sub.userID.soundcloud.username + '</a>').replace('{SUBMITTED_TO_ACCOUNT_NAME_WITH_LINK}', '<a href="' + sub.userID.soundcloud.permalinkURL + '">' + sub.userID.soundcloud.username + '</a>').replace('{TRACK_ARTWORK}', '<img src="' + sub.artworkURL + '" style="width:200px; height: 200px"/>').replace('{ACCEPTED_CHANNEL_LIST}', sub.nameString).replace('{ACCEPTED_CHANNEL_LIST_WITH_LINK}', sub.nameStringWithLink).replace('{TODAYSDATE}', new Date().toLocaleDateString()).replace(/\n/g, "<br>");
}

router.delete('/decline/:subID/:password', function(req, res, next) {
  if (!req.user.role == 'admin') {
    next(new Error('Unauthorized'));
    return;
  } else {
    Submission.findById(req.params.subID)
      .populate("userID")
      .then(function(sub) {
        if (!sub.ignoredBy) sub.ignoredBy = [];
        sub.ignoredBy.push(req.user._id.toJSON());
        sub.pooledSendDate = new Date((new Date()).getTime() + 72 * 3600000);
        sub.status = 'pooled';
        sub.save();
        var declineEmail = {};
        if (req.user.repostCustomizeEmails && req.user.repostCustomizeEmails.length > 0) {
          declineEmail = req.user.repostCustomizeEmails[0].decline;
          sub.nameStringWithLink = ""
          sub.nameString = "";
          var body = formatForEmail(declineEmail.body, sub);
          var subject = formatForEmail(declineEmail.subject, sub);
          sendEmail(sub.name, sub.email, "Artists Unlimited", "coayscue@artistsunlimited.com", subject, body);
        }
        res.send(sub);
      })
      .then(null, next);
  }
});

router.get('/withID/:subID', function(req, res, next) {
  Submission.findById(req.params.subID)
    .then(function(sub) {
      if (!sub) next(new Error('submission not found'))
      sub = sub.toJSON();
      var arrChannels = [];
      var query = {};
      if (sub.status == "pooled") {
        query = {
          'soundcloud.id': {
            $in: sub.channelIDS
          }
        }
      } else if (sub.status == "poolSent") {
        query = {
          'soundcloud.id': {
            $in: sub.pooledChannelIDS
          }
        }
      }
      User.find(query)
        .then(function(channels) {
          var channelPromArray = [];
          channels.forEach(function(channel) {
            channel = channel.toJSON();
            channelPromArray.push(User.findOne({
              'paidRepost.userID': channel._id
            }).then(function(admin) {
              if (admin) {
                var ch = admin.paidRepost.find(function(acc) {
                  return acc.userID.toString() == channel._id.toString()
                });
                if (ch) {
                  ch = ch.toJSON();
                  ch.user = channel.soundcloud;
                  return new Promise(function(resolve, reject) {
                    scWrapper.setToken(ch.user.token);
                    var reqObj = {
                      method: 'GET',
                      path: '/me',
                      qs: {}
                    };
                    scWrapper.request(reqObj, function(err, data) {
                      if (ch.linkInBio == undefined && data) ch.linkInBio = JSON.stringify(data).includes('artistsunlimited');
                      resolve(ch);
                    })
                  })
                }
              }
            }).then(function(newCh) {
              if (newCh && newCh.linkInBio) {
                arrChannels.push(newCh);
              }
            }));
          })
          return Promise.all(channelPromArray)
        }).then(function(chans) {
          sub.channels = arrChannels;
          res.send(sub);
        }).then(null, next)
    }).then(null, next);
});

router.post('/youtubeInquiry', function(req, res, next) {
  sendEmail('Zach', 'zacharia@peninsulamgmt.com', "Artists Unlimited", "coayscue@artistsunlimited.com", "Youtube Release", "Submitter's name: " + req.body.name + "<br><br>Email: " + req.body.email + "<br><br>Song URL: " + req.body.trackURL);
  res.end();
})

router.post('/sendMoreInquiry', function(req, res, next) {
  sendEmail(req.body.name, req.body.email, "Edward Sanchez", "edward@peninsulamgmt.com", 'Loved your submissions', "Hey " + req.body.name + ",<br><br>My name is Edward and I’m one of the managers here at AU. Your name appeared in our system after you submitted your track online. Normally there is not much worth looking into on their but yours has caught my eye.<br><br>I’d love to hear more of your work. We would love to potentially release one of your tracks on our network. Do you have a plan or anything in particular that you were looking for from us?<br><br>Looking forward to hearing from you.<br><br>Cheers<br><br>Edward Sanchez<br>AU Team<br>www.facebook.com/edwardlatropical");
  res.end();
})

router.delete('/ignore/:subID/:password', function(req, res, next) {
  if (!req.user.role == 'admin') {
    next({
      message: 'Forbidden',
      status: 403
    })
  } else {
    Submission.findById(req.params.subID)
      .then(function(sub) {
        if (!sub.ignoredBy) sub.ignoredBy = [];
        sub.ignoredBy.push(req.user._id.toJSON());
        if (sub.status == "submitted") {
          sub.pooledSendDate = new Date((new Date()).getTime() + 72 * 3600000);
          sub.status = 'pooled';
        }
        sub.save();
        res.send(sub);
      })
      .then(null, next);
  }
});

router.post('/getPayment', function(req, res, next) {
  var nameString = "Reposts on: ";
  req.body.channels.forEach(function(ch) {
    nameString += ch.user.username + " - ";
  });
  paypalCalls.makePayment(req.body.total, nameString, rootURL + "/complete", rootURL + "/pay/" + req.body.submission._id)
    .then(function(payment) {
      var submission = req.body.submission;
      if (submission.status == 'pooled') {
        submission.paidChannels = req.body.channels;
        submission.payment = payment;
      } else {
        submission.paidPooledChannels = req.body.channels;
        submission.pooledPayment = payment;
      }
      submission.discounted = req.body.discounted;
      return Submission.findByIdAndUpdate(req.body.submission._id, submission, {
        new: true
      })
    }).then(function(submission) {
      var payment = submission.status == 'pooled' ? submission.payment : submission.pooledPayment;
      var redirectLink = payment.links.find(function(link) {
        return link.rel == "approval_url";
      })
      res.send(redirectLink.href);
    })
    .then(null, next);
})

router.put('/completedPayment', function(req, res, next) {
  var responseObj = {
    events: []
  };
  var sub;
  Submission.findOne({
      $or: [{
        'payment.id': req.body.paymentId
      }, {
        'pooledPayment.id': req.body.paymentId
      }]
    })
    .then(function(submission) {
      if (submission) {
        sub = responseObj.submission = submission;
        var payment = sub.status == 'pooled' ? sub.payment : sub.pooledPayment;
        return paypalCalls.executePayment(payment.id, {
          payer_id: req.body.PayerID,
          transactions: payment.transactions
        });
      } else next(new Error('submission not found'));
    })
    .then(function(payment) {
      var promiseArray = [];
      if (sub.trackID) {
        if (sub.status == 'pooled') {
          sub.payment = payment;
          sub.paidChannels.forEach(function(channel) {
            promiseArray.push(schedulePaidRepost(channel, sub));
          });
        } else {
          sub.pooledPayment = payment;
          sub.paidPooledChannels.forEach(function(channel) {
            promiseArray.push(schedulePaidRepost(channel, sub));
          });
        }
        return Promise.all(promiseArray)
      } else {
        return [];
      }
    })
    .then(function(events) {
      sub.refundDate = new Date((new Date(sub.pooledSendDate)).getTime() + 72 * 60 * 60 * 1000);
      events.forEach(function(event) {
        var wouldBeRefundDate = new Date(new Date(event.event.day).getTime() + 4 * 60 * 60 * 1000)
        if (wouldBeRefundDate > sub.refundDate) sub.refundDate = wouldBeRefundDate;
      })
      sub.save();
      User.findOne({
        'soundcloud.id': events[0].event.userID
      }).then(function(user) {
        var calendarLink = rootURL + "/repostevents/" + user.soundcloud.pseudoname + "/" + events[0].event.pseudoname + "?paid=true";
        var buyMoreLink = rootURL + "/pay/" + sub._id;
        sendEmail(sub.name, sub.email, "Artists Unlimited", "coayscue@artistsunlimited.com", "Useful links", "Hello " + sub.name + ",<br><br>Thank you for your purchase! Here are some useful links for your records:<br><br><a href=" + calendarLink + ">Paid Repost Calendar</a><br><br><a href=" + buyMoreLink + ">Buy More Reposts</a><br><br>Thank you,<br>Artists Unlimited");
        res.json({
          link: calendarLink
        });
      }).then(null, next)
    })
    .then(null, next);
})

function schedulePaidRepost(channel, submission) {
  return new Promise(function(fulfill, reject) {
    scWrapper.setToken(channel.user.token);
    var reqObj = {
      method: 'DELETE',
      path: '/e1/me/track_reposts/' + submission.trackID,
      qs: {
        oauth_token: channel.user.token
      }
    };
    scWrapper.request(reqObj, function(err, data) {});
    var payment = submission.status == 'pooled' ? submission.payment : submission.pooledPayment;
    User.findById(channel.userID)
      .then(function(user) {
        var eventDetails = {
          type: 'paid',
          trackID: submission.trackID,
          title: submission.title,
          trackURL: submission.trackURL,
          trackArtUrl: submission.artworkURL,
          artistName: submission.trackArtist,
          userID: channel.user.id,
          email: submission.email,
          name: submission.name,
          price: channel.price,
          saleID: payment.transactions[0].related_resources[0].sale.id
        }
        if (user.repostSettings && user.repostSettings.paid && user.repostSettings.paid.like) eventDetails.like = true;
        if (user.repostSettings && user.repostSettings.paid && user.repostSettings.paid.comment) eventDetails.comment = user.repostSettings.paid.comments[Math.floor(Math.random() * user.repostSettings.paid.comments.length)];
        scheduleRepost(eventDetails, new Date(new Date().getTime() + 3600000), 7 * 24)
          .then(function(event) {
            fulfill({
              channelName: channel.user.username,
              date: event.day,
              event: event
            });
          }).then(null, reject);
      }).then(null, reject);
  })
}

function calcHour(hour, destOffset) {
  var day = new Date();
  var diff = (3600000 * destOffset) + day.getTimezoneOffset() * 60000;
  var hourDiff = -diff / 3600000;
  var retHour = (hour + hourDiff) % 24;
  return retHour;
}

router.post('/getSoldReposts', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var newObj = {};
  var accounts = req.user.paidRepost;
  var results = [];
  var resultsReady = [];
  req.user.paidRepost.forEach(function(acc) {
    var user;
    resultsReady.push(User.findOne({
      _id: acc.userID
    }).then(function(usr) {
      user = usr;
      if (usr) {
        return RepostEvent.find({
          day: {
            $gt: req.body.lowDate,
            $lt: req.body.highDate
          },
          userID: usr.soundcloud.id,
          type: "paid"
        })
      } else {
        return [];
      }
    }).then(function(events) {
      var subArray = [];
      events.forEach(function(event) {
        subArray.push(
          Submission.findOne({
            'pooledPayment.transactions.related_resources.sale.id': event.saleID
          }).then(function(submission) {
            var newObj = {
              user: user,
              data: event,
              marketplace: !!submission
            }
            results.push(newObj);
            return ('ok');
          })
        );
      })
      return Promise.all(subArray)
    }));
  })
  Promise.all(resultsReady)
    .then(function(done) {
      res.send(results);
    }).then(null, next);
});

router.post('/submissionData', function(req, res, next) {
  var resObj = {}
  User.findById(req.user._id).populate('paidRepost.userID')
    .then(function(adminUser) {
      resObj.accounts = adminUser.paidRepost;
      var adminIDS = adminUser.paidRepost.map(function(element) {
        return element.userID.soundcloud.id;
      })
      var userIDS = adminUser.paidRepost.map(function(element) {
        return element.userID._id;
      });
      Submission.find({
          submissionDate: {
            $gt: req.body.lowDate,
            $lt: req.body.highDate
          },
          userID: {
            $in: userIDS
          }
        }).then(function(directSubs) {
          var dsPromArray = [];
          directSubs.forEach(function(sub) {
            dsPromArray.push(new Promise(function(resolve, reject) {
              if (sub.pooledPayment && sub.pooledPayment.state == "approved") {
                RepostEvent.find({
                  saleID: sub.pooledPayment.transactions[0].related_resources[0].sale.id,
                  payout: {
                    $ne: null
                  }
                }).then(function(events) {
                  var ffEarnings = 0;
                  events.forEach(function(event) {
                    ffEarnings += event.price * 0.15;
                  })
                  resolve({
                    sub: sub,
                    ffEarnings: ffEarnings
                  });
                }).then(null, reject);
              } else {
                resolve({
                  sub: sub,
                  ffEarnings: 0
                });
              }
            }))
          })
          return Promise.all(dsPromArray);
        }).then(function(directSubs) {
          resObj.directSubs = directSubs;
          return PremiereSubmission.find({
            submissionDate: {
              $gt: req.body.lowDate,
              $lt: req.body.highDate
            },
            userID: {
              $in: userIDS
            }
          })
        })
        .then(function(premiereSubs) {
          resObj.premiereSubs = premiereSubs;
          res.send(resObj);
        }).then(null, next)
    }).then(null, next);
})

router.get('/currentAllowance', function(req, res, next) {
  Submission.find({
      ignoredBy: req.user._id.toJSON(),
      status: 'pooled',
      pooledSendDate: {
        $gt: new Date()
      }
    })
    .then(function(subs) {
      var allowance = 0;
      var prIDS = [];
      req.user.paidRepost.forEach(function(pr) {
        prIDS.push(pr.userID.toJSON());
      });
      subs.forEach(function(sub) {
        if (!prIDS.includes(sub.userID.toJSON())) allowance -= 1;
      })
      Submission.find({
          userID: {
            $in: prIDS
          },
          pooledSendDate: {
            $lt: new Date(new Date().getTime() + 2 * 24 * 3600000),
            $gt: new Date(new Date().getTime() - 1 * 24 * 3600000)
          },
          'payment.state': "approved"
        })
        .then(function(paidSubs) {
          allowance += 10 * paidSubs.length;
          res.send({
            allowance: allowance
          });
        }).then(null, next);
    }).then(null, next);
})
