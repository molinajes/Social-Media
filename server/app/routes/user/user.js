var mongoose = require('mongoose');
var User = mongoose.model('User');
var SCEmails = mongoose.model('SCEmails');
var Trade = mongoose.model('Trade');
var https = require('https');
var router = require('express').Router();
var scConfig = global.env.SOUNDCLOUD;
var scWrapper = require("../../SCWrapper/SCWrapper.js");
var Busboy = require('busboy');
var AWS = require('aws-sdk');
var awsConfig = require('./../../../env').AWS;
var rootURL = require('./../../../env').ROOTURL;

scWrapper.init({
  id: scConfig.clientID,
  secret: scConfig.clientSecret,
  uri: scConfig.callbackURL
});
module.exports = router;

router.get('/isUserAuthenticate', function(req, res, next) {
  if (req.user && req.user._id != undefined) {
    res.send(req.user);
  } else {
    res.send(null);
  }
});

router.get('/byId/:id', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  User.findById(req.params.id)
    .then(function(user) {
      res.send(user);
    }).then(null, next)
});

router.get('/bySoundcloudID/:id', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  User.findOne({
      'soundcloud.id': parseInt(req.params.id)
    })
    .then(function(user) {
      //if (user.soundcloud.token) user.soundcloud.token = undefined;
      res.send(user);
    }).then(null, next)
});

router.post('/withIDs', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  User.find({
      _id: {
        $in: req.body
      }
    })
    .then(function(users) {
      res.send(users);
    }).then(null, next)
});

router.get('/getUserID', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  User.findOne({
      role: 'superadmin'
    }).limit(1)
    .then(function(user) {
      res.send(user._id);
    })
});

router.get('/getUserByURL/:username/:lastpart', function(req, res, next) {
  var query = {};
  var url = rootURL + "/" + req.params.username + "/" + req.params.lastpart;
  var customUrl = rootURL + "/custom/" + req.params.username + "/" + req.params.lastpart;
  if (req.params.lastpart.indexOf('submit') != -1) {
    query = {
      $or: [{
        'paidRepost.submissionUrl': url
      }, {
        'paidRepost.submissionUrl': customUrl
      }]
    };
  } else {
    query = {
      $or: [{
        'paidRepost.premierUrl': url
      }, {
        'paidRepost.premierUrl': customUrl
      }]
    };
  }
  User.findOne(query)
    .then(function(user) {
      if (user && user.paidRepost.length > 0) {
        if (req.params.lastpart.indexOf('submit') != -1) {
          var u = user.paidRepost.find(function(pr) {
            return pr.submissionUrl == url || pr.submissionUrl == customUrl;
          })
          if (u) {
            res.send(u.userID);
          } else {
            res.send("nouser");
          }
        } else {
          var u = user.paidRepost.find(function(pr) {
            return pr.premierUrl == url || pr.premierUrl == customUrl;
          })
          if (u) {
            res.send(u.userID);
          } else {
            res.send("nouser");
          }
        }
      } else {
        res.send("nouser");
      }
    })
    .then(null, next);
});

router.post('/bySCURL', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var minFollowers = (req.body.minFollower ? parseInt(req.body.minFollower) : 0);
  var maxFollowers = (req.body.maxFollower ? parseInt(req.body.maxFollower) : 100000000);
  var originalUrl = (req.body.url != "") ? req.body.url : undefined;
  var url = originalUrl;
  var searchObj = {};
  var recordRange = {
    skip: 0,
    limit: 12
  };
  if (req.body.recordRange) {
    recordRange = {
      skip: req.body.recordRange.skip || 0,
      limit: req.body.recordRange.limit || 12
    }
  }
  if (url != undefined) {
    url = url.toString().replace('http://', '').replace('https://', '');
    searchObj['soundcloud.permalinkURL'] = new RegExp(url);
  } else if (maxFollowers > 0) {
    searchObj['soundcloud.followers'] = {
      $gte: minFollowers,
      $lte: maxFollowers,
    }
  }
  var notInUsers = [];
  Trade.find({
      $or: [{
        'p1.user': req.user._id
      }, {
        'p2.user': req.user._id
      }]
    })
    .then(function(trades) {
      if (trades.length > 0) {
        trades.forEach(function(trade, index) {
          var u1 = trade.p1.user.toString();
          var u2 = trade.p2.user.toString();
          if (notInUsers.indexOf(u1) == -1) {
            notInUsers.push(u1);
          }
          if (notInUsers.indexOf(u2) == -1) {
            notInUsers.push(u2);
          }
          if (index == (trades.length - 1)) {
            searchObj['_id'] = {
              $nin: notInUsers
            };
            findUsers(searchObj);
          }
        });
      } else {
        searchObj['_id'] = {
          $nin: req.user._id
        };
        findUsers(searchObj);
      }
    }).then(null, next);
  var findUsers = function(sObj) {
    if (originalUrl !== '' && originalUrl !== undefined) {
      var reqObj = {
        method: 'GET',
        path: '/resolve.json',
        qs: {
          url: originalUrl
        }
      };
      scWrapper.request(reqObj, function(err, result) {
        if (err) {
          return res.json({
            "success": false,
            message: "Error in processing your request"
          });
        };
        https.get(result.location, function(httpRes2) {
          var userBody = '';
          httpRes2.on("data", function(songChunk) {
              userBody += songChunk;
            })
            .on("end", function() {
              var user = JSON.parse(userBody);
              var updateUser = {
                'name': user.username,
                'soundcloud': {
                  'id': user.id,
                  'username': user.username,
                  'permalinkURL': user.permalink_url,
                  'avatarURL': user.avatar_url.replace('large', 't500x500'),
                  'followers': user.followers_count,
                  'pseudoname': user.permalink_url.substring(user.permalink_url.indexOf('.com/') + 5),
                  'role': 'user'
                }
              }
              User.findOneAndUpdate({
                  'soundcloud.id': user.id
                }, updateUser, {
                  upsert: true,
                  new: true
                })
                .then(function(data) {
                  console.log(data)
                  res.send([data]);
                }).then(null, next);
            });
        });
      });
    } else {
      User.find(sObj)
        .sort({
          'soundcloud.followers': -1
        })
        .skip(recordRange.skip)
        .limit(recordRange.limit)
        .then(function(user) {
          if (user.length > 0) {
            res.send(user);
          } else {
            res.send([]);
          }
        }).then(null, next);
    }
  }
});

/*profile updateion*/
router.post('/profilePicUpdate', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  parseMultiPart()
    .then(uploadToBucket)
    .catch(errorHandler);
  var body = {
    fields: {},
    file: {}
  };

  function parseMultiPart() {
    return new Promise(function(resolve, reject) {
      var busboy = new Busboy({
        headers: req.headers,
        limits: {
          fileSize: 100 * 1024 * 1024,
          files: 1
        }
      });
      busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        var buffer = new Buffer('');
        var type = mimetype.split('/')[1];
        var newfilename = (filename.substr(0, filename.lastIndexOf('.')) || filename) + '_' + Date.now().toString() + '.' + type;
        file.on('data', function(data) {
          buffer = Buffer.concat([buffer, data]);
        });
        file.on('limit', function() {
          reject('Error: File size cannot be more than 20 MB');
        });
        file.on('end', function() {
          body.file = {
            fieldname: fieldname,
            buffer: buffer,
            filename: filename,
            newfilename: newfilename,
            encoding: encoding,
            mimetype: mimetype
          };
        });
      });
      busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        body.fields[fieldname] = val;
      });
      busboy.on('finish', function() {
        resolve();
      });

      busboy.on('error', function(err) {
        reject(err);
      });
      req.pipe(busboy);
    });
  }

  function uploadToBucket() {
    return new Promise(function(resolve, reject) {
      AWS.config.update({
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      });
      var data = {
        Key: body.file.newfilename,
        Body: body.file.buffer,
        ContentType: body.file.mimetype
      };
      var s3 = new AWS.S3({
        params: {
          Bucket: awsConfig.profileimageBucketName
        }
      });
      s3.upload(data, function(err, data) {
        if (err) {
          reject(err);
          res.send({
            success: false,
            data: data
          });
        } else {

          resolve(data);
          res.send({
            success: true,
            data: data
          });
        }
      });
    });
  }

  function errorHandler(err) {
    console.log(err);
    return res.status(400).send(err);
  }
});

router.put('/updateAdmin', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  User.findByIdAndUpdate(req.user._id, req.body)
    .then(function(user) {
      res.send(user);
    }).then(null, next);
})


router.put('/updateuserRecord', function(req, res, next) {
  var id = req.body._id;
  delete req.body._id;
  User.findByIdAndUpdate(id, req.body)
    .then(function(user) {
      res.send(user);
    }).then(null, next);
})

/*Admin profile update start*/
router.post('/updateAdminProfile', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var body = req.body;
  var updateObj = body;
  if (updateObj.pictureUrl) {
    updateObj.profilePicture = body.pictureUrl
  }
  if (updateObj.email) {
    updateObj.email = body.email;
  }
  if (updateObj.password) {
    updateObj.salt = User.generateSalt();
    updateObj.password = User.encryptPassword(body.password, updateObj.salt);
  }
  if (updateObj.email != "" && updateObj.email != undefined) {
    User.findOne({
      '_id': {
        $ne: req.user._id
      },
      role: 'admin',
      email: body.email
    }, function(err, u) {
      if (u) {
        res.send({
          message: "Email already register."
        });
      } else {
        User.findOneAndUpdate({
            '_id': req.user._id
          }, {
            $set: updateObj
          }, {
            new: true
          })
          .then(function(result) {
            res.send(result);
          })
          .then(null, function(err) {
            next(err);
          });
      }
    })
  } else {
    User.findOneAndUpdate({
        '_id': req.user._id
      }, {
        $set: updateObj
      }, {
        new: true
      })
      .then(function(result) {
        res.send(result);
      })
      .then(null, function(err) {
        next(err);
      });
  }
});

router.post('/checkUsercount', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var query = {
    "paidRepost.submissionUrl": req.body.url
  };
  if (req.body.action == "id")
    query = {
      "paidRepost.userID": req.body.userID,
      "_id": req.user._id
    };

  User.find(query)
    .then(function(user) {
      if (user)
        return res.json(user.length);
      else
        return res.json(0);
    })
})

/*Admin profile update start*/
router.post('/updatePaidRepost', function(req, res, next) {
  var body = req.body;
  body.createdOn = new Date();
  User.findOneAndUpdate({
      '_id': req.user._id,
      'paidRepost.userID': body.userID
    }, {
      $set: {
        'paidRepost.$': body
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

router.get('/getUserPaidRepostAccounts', function(req, res) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var accounts = req.user.paidRepost;
  var results = [];
  var i = -1;
  var next = function() {
    i++;
    if (i < accounts.length) {
      var acc = accounts[i];
      User.findOne({
        _id: acc.userID
      }, function(e, u) {
        if (u) {
          results.push(u);
        }
        next();
      });
    } else {
      res.send(results);
    }
  }
  next();
});

router.post('/saveTemplates', function(req, res, next) {
  User.findById(req.user._id)
    .then(function(adminUser) {
      adminUser.templates = req.body;
      adminUser.save();
      res.send(adminUser.templates);
    }).then(null, next);
})
