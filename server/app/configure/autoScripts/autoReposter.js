var mongoose = require('mongoose');
var User = mongoose.model('User');
var Trade = mongoose.model('Trade');
var RepostEvent = mongoose.model('RepostEvent');
var Submission = mongoose.model('Submission');
var scWrapper = require("../../SCWrapper/SCWrapper.js");
var scConfig = require('./../../../env').SOUNDCLOUD;
var sendEmail = require('../../mandrill/sendEmail.js');
var request = require('request');
var notificationCenter = require('../../notificationCenter/notificationCenter.js');
var paypalCalls = require('../../payPal/paypalCalls.js');
var scheduleRepost = require('../../scheduleRepost/scheduleRepost.js');
var denyUnrepostOverlap = require('../../scheduleRepost/denyUnrepostOverlap.js');
module.exports = doRepost;
//executes every 5 min
function doRepost() {
  setTimeout(function() {
    doRepost();
  }, 300000);
  var lowerDate = new Date();
  lowerDate.setTime(lowerDate.getTime() - lowerDate.getMinutes() * 60 * 1000 - lowerDate.getSeconds() * 1000);
  var upperDate = new Date();
  upperDate.setTime(upperDate.getTime() - upperDate.getMinutes() * 60 * 1000 - upperDate.getSeconds() * 1000 + 60 * 60 * 1000);

  RepostEvent.find({
      completed: false,
      day: {
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
            event.day = new Date(event.day);
            event.unrepostDate = new Date(event.unrepostDate);
            repostAndRemove(event, user, 0);
            if (event.comment) postComment(event, user);
            if (event.like) postLike(event, user);
          })
          .then(null, function(err) {
            console.log(err);
          })
      })
    })
    .then(null, function(err) {
      console.log(err);
    });
}

function repostAndRemove(event, user, repCount) {
  var message = {
    type: 'alert',
    senderId: event.owner,
    date: new Date()
  };
  var idPromise = getID(event, user);
  idPromise.then(function(id) {
    event.trackID = id;
    scWrapper.setToken(user.soundcloud.token);
    var reqObj = {
      method: 'PUT',
      path: '/e1/me/track_reposts/' + id,
      qs: {
        oauth_token: user.soundcloud.token
      }
    };
    scWrapper.request(reqObj, function(err, data) {
      if (!err) {
        event.completed = true;
        event.save().then(function(event) {
          if (event.name && event.email) {
            distributeEarnings(user, event);
          }
          notificationCenter.sendNotifications(user._id, 'trackRepost', 'Track repost', ((!!event.title) ? event.title : 'A track') + ' was reposted on ' + user.soundcloud.username, 'https://artistsunlimited.com/artistTools/scheduler');
          console.log('event');
          console.log(event);
          if (!event.title) {
            scWrapper.setToken(user.soundcloud.token);
            var reqObj = {
              method: 'GET',
              path: '/tracks/' + event.trackID,
              qs: {}
            }
            scWrapper.request(reqObj, function(err, data) {
              if (!err && data.title) {
                console.log(data);
                event.title = data.title;
                event.trackURL = data.permalink_url;
                event.trackArtUrl = data.artwork_url;
                event.artistName = data.user.username;
                if (data.permalink_url) {
                  var pseudoname = data.permalink_url.substring(data.permalink_url.indexOf('.com/') + 5)
                  pseudoname = pseudoname.substring(pseudoname.indexOf('/') + 1)
                  event.pseudoname = pseudoname;
                }
                event.save();
              }
            });
          }
        }).then(null, console.log);
      } else {
        console.log('error ------------------');
        console.log(err);
        console.log(data);
        var now = new Date();
        if (now.getMinutes() >= 55) {
          if (JSON.stringify(err).includes('too many reposts')) {
            err = ((typeof err) == 'string' ? JSON.parse(err) : err)[0];
            user.blockRelease = new Date(err.release_at);
            user.save();
          }
          if (event.email && event.name) {
            var newEvent = JSON.parse(JSON.stringify(event));
            delete newEvent._id;
            scheduleRepost(newEvent, new Date(new Date().getTime() + 2 * 24 * 3600000), 7 * 24)
              .then(function(ev) {
                Submission.findOne({
                  $or: [{
                    'pooledPayment.transactions.related_resources.sale.id': ev.saleID
                  }, {
                    'payment.transactions.related_resources.sale.id': ev.saleID
                  }]
                }).then(function(submission) {
                  sendEmail(ev.name, ev.email, "Artists Unlimited", "coayscue@artistsunlimited.com", "Failed Repost reschedule and refund", "Hi " + ev.name + ",<br><br>There was an error reposting " + ev.title + " on " + user.soundcloud.username + ". <br><br>You will be refunded the price of the repost, $" + ev.price + ", on " + (new Date(submission.refundDate)).toLocaleDateString() + ".<br><br>The track has also been rescheduled to be reposted on " + user.soundcloud.username + " on " + ev.day.toLocaleDateString() + ".<br><br>-<a href='https://artistsunlimited.com'>Artists Unlimited</a>");
                }).then(null, console.log)
              }).then(null, console.log);
          } else if (event.owner) {
            var newEvent = JSON.parse(JSON.stringify(event));
            delete newEvent._id;
            scheduleRepost(newEvent, new Date(), 24).then(null, console.log);
          }
          notificationCenter.sendNotifications(user._id, 'failedRepost', 'Failed repost', event.title + ' did not repost on ' + user.soundcloud.username + ' did not complete.', 'https://artistsunlimited.com/artistTools/scheduler');
        }
      }
    });
  }).then(null, console.log)
}

function getID(event, user) {
  return new Promise(function(resolve, reject) {
    var id;
    var count = 0;
    var findAgain = function(person) {
      if (count < person.queue.length) {
        id = person.queue[count];
        scWrapper.setToken(user.soundcloud.token);
        var reqObj = {
          method: 'GET',
          path: '/tracks/' + id,
          qs: {}
        }
        scWrapper.request(reqObj, function(err, data) {
          if (!err && data.user.id != person.soundcloud.id) {
            denyUnrepostOverlap(event)
              .then(function(ok) {
                resolve(id);
              })
              .then(null, function(err) {
                if (err.message == 'overlap') {
                  count++;
                  findAgain(person);
                } else {
                  console.log(err);
                }
              })
          } else {
            count++;
            person.save().then(function() {
              findAgain(person);
            })
          }
        });
      } else {
        reject();
      }
    }

    if (!event.trackID) {
      if (event.type == 'queue') {
        findAgain(user);
      } else if (event.type == 'traded') {
        User.findById(event.owner)
          .then(function(owner) {
            if (owner) {
              findAgain(owner);
            }
          })
      }
    } else {
      resolve(event.trackID);
    }
  })
}

function postComment(event, user) {
  scWrapper.request({
    method: 'GET',
    path: '/tracks/' + event.trackID,
    qs: {
      oauth_token: user.soundcloud.token
    }
  }, function(err, track) {
    if (err) console.log(err);
    else {
      scWrapper.setToken(user.soundcloud.token);
      var reqObj = {
        method: 'POST',
        path: '/tracks/' + event.trackID + '/comments',
        qs: {
          oauth_token: user.soundcloud.token,
          'comment[body]': event.comment,
          'comment[timestamp]': Math.floor((Math.random() * track.duration))
        }
      }
      scWrapper.request(reqObj, function(err, response) {
        if (err) console.log(err)
        else console.log('success commenting');
      });
    }
  })
}

function postLike(event, user) {
  scWrapper.setToken(user.soundcloud.token);
  var reqObj = {
    method: 'PUT',
    path: '/me/favorites/' + event.trackID,
    qs: {
      oauth_token: user.soundcloud.token
    }
  };
  scWrapper.request(reqObj, function(err, response) {
    if (err) console.log(err);
    else console.log(response);
  })
}

function performStatBoosts(user, trackID) {
  var startingPlays = parseFloat(user.soundcloud.followers) / 80;
  var startingLikes = parseFloat(startingPlays) / 20;
  var startingReposts = parseFloat(startingPlays) / 100;
  for (var i = 0; i < 7; i++) {
    request.post('http://52.26.54.198:1337/api/bots/plays', {
      form: {
        hoursDelay: i * 24,
        hoursSpan: 24,
        numberPlays: Math.round(parseFloat(startingPlays) / Math.pow(2, i)),
        trackID: trackID
      }
    }, function(err, response, body) {})
    request.post('http://52.26.54.198:1337/api/bots/likes', {
      form: {
        hoursDelay: i * 24,
        hoursSpan: 24,
        numberLikes: Math.round(parseFloat(startingLikes) / Math.pow(2, i)),
        trackID: trackID
      }
    }, function(err, response, body) {})
    request.post('http://52.26.54.198:1337/api/bots/reposts', {
      form: {
        hoursDelay: i * 24,
        hoursSpan: 24,
        numberReposts: Math.round(parseFloat(startingReposts) / Math.pow(2, i)),
        trackID: trackID
      }
    }, function(err, response, body) {})
  }
}

function distributeEarnings(user, event) {
  console.log('distributing---------')
  var adUser;
  if (event.price) {
    User.findOne({
      "paidRepost.userID": user._id
    }).then(function(adminUser) {
      adUser = adminUser;
      return Submission.findOne({
        'pooledPayment.transactions.related_resources.sale.id': event.saleID
      }).then(function(submission) {
        if (submission) {
          if (submission.userID) {
            User.findOne({
              "paidRepost.userID": submission.userID
            }).then(function(originalAdminUser) {
              return paypalCalls.sendPayout(originalAdminUser.paypal_email, (event.price * 0.15).toFixed(2), "Repost on " + user.soundcloud.username + ".", event._id)
            }).then(console.log, console.log);
          }
          adminUser.cut -= 0.1;
        }
        return paypalCalls.sendPayout(adminUser.paypal_email, (event.price * adminUser.cut).toFixed(2), "Repost on " + user.soundcloud.username + ".", event._id)
      })
    }).then(function(payout) {
      event.payout = payout;
      event.save();
    }).then(null, function(err) {
      sendEmail('Christian Ayscue', 'coayscue@gmail.com', "Artists Unlimited", "coayscue@artistsunlimited.com", "Error distributing funds", "Error: " + JSON.stringify(err) + "<br><br>Admin User: " + JSON.stringify(adUser) + " <br><br>ATUser: " + JSON.stringify(user) + "<br><br>Event: " + JSON.stringify(event));
    })
  }
}
