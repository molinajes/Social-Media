var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Trade = mongoose.model('Trade');
var User = mongoose.model('User');
var RepostEvent = mongoose.model('RepostEvent');
var notificationCenter = require('../../notificationCenter/notificationCenter.js')

router.get('/withUser/:userID', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  if (req.user.role != "admin") {
    Trade.find({
        $or: [{
          'p1.user': req.params.userID
        }, {
          'p2.user': req.params.userID
        }]
      }).populate('p1.user').populate('p2.user')
      .then(function(trades) {
        trades = trades.filter(function(trade) {
          return !(trade.p1.accepted && trade.p2.accepted)
        })
        res.send(trades)
      }).then(null, next);
  } else {
    var paidRepostIds = [];
    if (req.user.paidRepost.length > 0) {
      req.user.paidRepost.forEach(function(acc) {
        paidRepostIds.push(acc.userID);
      })
    }
    Trade.find({
        $or: [{
          'p1.user': {
            $in: paidRepostIds
          }
        }, {
          'p2.user': {
            $in: paidRepostIds
          }
        }]
      }).populate('p1.user').populate('p2.user')
      .then(function(trades) {
        trades = trades.filter(function(trade) {
          return !(trade.p1.accepted && trade.p2.accepted)
        })
        res.send(trades)
      }).then(null, next);
  }
});

router.get('/doneWithUser/:userID', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  Trade.find({
      $or: [{
        'p1.user': req.params.userID
      }, {
        'p2.user': req.params.userID
      }]
    }).populate('p1.user').populate('p2.user')
    .then(function(trades) {
      trades = trades.filter(function(trade) {
        return (trade.p1.accepted && trade.p2.accepted)
      })
      res.send(trades)
    }).then(null, next);
});

router.post('/new', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var trade = new Trade(req.body);
  trade.save()
    .then(function(trade) {
      return Trade.populate(trade, {
        path: 'p1.user p2.user'
      })
    }).then(function(trade) {
      res.send(trade);
    })
    .then(null, next);
})


router.put('/', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var userid = req.user._id;
  if (req.body.userid != undefined)
    userid = req.body.userid;

  if (userid != req.body.p1.user._id && userid != req.body.p2.user._id) {
    next({
      message: 'Forbidden',
      status: 403
    })
  } else {
    Trade.findByIdAndUpdate(req.body._id, req.body, {
        new: true
      }).populate('p1.user').populate('p2.user')
      .then(function(trade) {
        console.log(trade);
        if (req.body.changed) {
          if (trade.p1.accepted && trade.p2.accepted) {
            var user = (req.user._id == trade.p1.user._id ? req.user : trade.p2.user);
            var other = (req.user._id == trade.p1.user._id ? trade.p2.user : req.user);
            notificationCenter.sendNotifications(other._id, 'tradeRequest', 'Accepted Trade', user.soundcloud.username + " accepted your trade.", "https://artistsunlimited.com/artistTools/reForReLists#managereposts");
          } else if (trade.p1.accepted && !trade.p2.accepted) {
            notificationCenter.sendNotifications(trade.p2.user._id, 'tradeRequest', 'Trade Request', trade.p1.user.soundcloud.username + " requests a trade with " + trade.p2.user.soundcloud.username + ".", "https://artistsunlimited.com/artistTools/reForReInteraction/" + trade._id);
          } else {
            notificationCenter.sendNotifications(trade.p1.user._id, 'tradeRequest', 'Trade Request', trade.p2.user.soundcloud.username + " requests a trade with " + trade.p1.user.soundcloud.username + ".", "https://artistsunlimited.com/artistTools/reForReInteraction/" + trade._id);
          }
        }
        res.send(trade);
      })
      .then(null, next);
  }
})

router.get('/withUsers/:user1Name/:user2Name', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  User.findOne({
      'soundcloud.pseudoname': req.params.user1Name
    }).then(function(p1) {
      return User.findOne({
        'soundcloud.pseudoname': req.params.user2Name
      }).then(function(p2) {
        return Trade.find({
          $or: [{
            'p1.user': p1._id,
            'p2.user': p2._id
          }, {
            'p1.user': p2._id,
            'p2.user': p1._id
          }]
        }).populate('p1.user').populate('p2.user')
      })
    })
    .then(function(trades) {
      var trade = trades.find(function(trade) {
        return !(trade.p1.accepted && trade.p2.accepted);
      })
      if (trade) {
        if (JSON.stringify(req.user._id) != JSON.stringify(trade.p1.user._id) && JSON.stringify(req.user._id) != JSON.stringify(trade.p2.user._id)) {
          next({
            message: 'Forbidden',
            status: 403
          })
        } else {
          res.send(trade);
        }
      } else {
        next(new Error('did not find a trade'))
      }
    }).then(null, next);
})

router.get('/byID/:tradeID', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  Trade.findById(req.params.tradeID).populate('p1.user').populate('p2.user')
    .then(function(trade) {
      if (JSON.stringify(req.user._id) != JSON.stringify(trade.p1.user._id) && JSON.stringify(req.user._id) != JSON.stringify(trade.p2.user._id)) {
        next({
          message: 'Forbidden',
          status: 403
        })
      } else {
        res.send(trade);
      }
    })
    .then(null, next);
})

router.get('/byID/:tradeID/:userId', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var userid = req.params.userId;
  Trade.findById(req.params.tradeID).populate('p1.user').populate('p2.user')
    .then(function(trade) {
      if (userid != trade.p1.user._id && userid != trade.p2.user._id) {
        next({
          message: 'Forbidden',
          status: 403
        })
      } else {
        res.send(trade);
      }
    })
    .then(null, next);
})

router.post('/delete', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  Trade.findById(req.body.id)
    .then(function(trade) {
      if (JSON.stringify(req.user._id) != JSON.stringify(trade.p1.user) && JSON.stringify(req.user._id) != JSON.stringify(trade.p2.user) && (req.body.action != "admin" || req.body.action == undefined)) {
        next({
          message: 'Forbidden',
          status: 403
        })
      } else {
        trade.remove();
        res.send(trade);
      }
    }).then(null, next);
});

router.get('/getTradeData/:tradeID', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var trade = {};
  var arrP1Events = [];
  var arrP2Events = [];
  var arrUserTrades = [];
  Trade.findById(req.params.tradeID).populate('p1.user').populate('p2.user')
    .then(function(trd) {
      var trade = trd.toJSON();
      if (JSON.stringify(req.user._id) != JSON.stringify(trade.p1.user._id) && JSON.stringify(req.user._id) != JSON.stringify(trade.p2.user._id)) {
        next({
          message: 'Forbidden',
          status: 403
        })
      } else {
        RepostEvent.find({
            userID: trade.p1.user.soundcloud.id
          })
          .then(function(p1Events) {
            arrP1Events = p1Events;
            RepostEvent.find({
                userID: trade.p2.user.soundcloud.id
              })
              .then(function(p2Events) {
                arrP2Events = p2Events;
                Trade.find({
                    $or: [{
                      'p1.user': req.user._id
                    }, {
                      'p2.user': req.user._id
                    }]
                  }).populate('p1.user').populate('p2.user')
                  .then(function(trades) {
                    var tradesResult = [];
                    var i = -1;
                    if (trades.length > 0) {
                      var next = function() {
                        i++;
                        if (i < trades.length) {
                          var t = trades[i].toJSON();
                          if (t.p1.user && t.p2.user) {
                            t.unfilledTrackCount = 0;
                            var ownerid = (t.p1.user._id.toString() === req.user._id.toString() ? t.p1.user._id : t.p2.user._id);
                            var userid = (t.p1.user._id.toString() === req.user._id.toString() ? t.p2.user.soundcloud.id : t.p1.user.soundcloud.id);
                            RepostEvent.count({
                              day: {
                                $gt: new Date()
                              },
                              owner: ownerid,
                              userID: userid,
                              trackID: {
                                $exists: false
                              },
                              type: 'traded'
                            })

                            .then(function(events) {
                              t.unfilledTrackCount = events;
                              tradesResult.push(t);
                              next();
                            });
                          } else {
                            next();
                          }
                        } else {
                          arrUserTrades = tradesResult;
                          res.send({
                            trade: trade,
                            p1Events: arrP1Events,
                            p2Events: arrP2Events,
                            userTrades: arrUserTrades
                          });
                        }
                      }
                      next();
                    } else {
                      res.send({
                        trade: trade,
                        p1Events: arrP1Events,
                        p2Events: arrP2Events,
                        userTrades: arrUserTrades
                      });
                    }
                  })
              })
          })
      }
    })
    .then(null, next);
});

router.put('/offline', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var userid = req.user._id;
  if (req.body.userid != undefined)
    userid = req.body.userid;

  Trade.update({
    _id: req.body.tradeID,
    'p1.user': userid
  }, {
    'p1.online': false
  }, function(e, r) {});
  Trade.update({
    _id: req.body.tradeID,
    'p2.user': userid
  }, {
    'p2.online': false
  }, function(e, r) {
    res.send(r);
  });
});

router.put('/hideNotification', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var trades = req.body;
  var i = -1;
  if (trades.length > 0) {
    var next = function() {
      i++;
      if (i < trades.length) {
        var tradeId = trades[i]._id;
        if (trades[i].p1.user == req.user._id) {
          Trade.findOneAndUpdate({
            '_id': trades[i]._id,
            $set: {
              'p1.alert': 'none'
            }
          }).then(function(r) {
            next();
          });
        } else {
          Trade.findOneAndUpdate({
            '_id': trades[i]._id,
            $set: {
              'p2.alert': 'none'
            }
          }).then(function(r) {
            next();
          });
        }
      } else {
        res.send();
      }
    }
    next();
  }
});
