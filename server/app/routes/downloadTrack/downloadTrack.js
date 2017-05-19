'use strict';
var express = require('express');
var https = require('https');
var app = express();
var path = require("path");
var bodyParser = require('body-parser');
var YoutubeOauth;
var Youtube = require("youtube-api");
var Opn = require("opn");
var router = require('express').Router();
var Promise = require('bluebird');
var request = require('request');
var qs = require('qs');
var rootURL = require('./../../../env').ROOTURL;
module.exports = router;

var mongoose = require('mongoose');
var DownloadTrack = mongoose.model('DownloadTrack');
var User = mongoose.model('User');
var env = require('./../../../env');
var scConfig = require('./../../../env').SOUNDCLOUD;
var sendEmail = require('../../mandrill/sendEmail.js');
var scWrapper = require("../../SCWrapper/SCWrapper.js");
var Channel = mongoose.model('Channel');
var SCEmails = mongoose.model('SCEmails');


scWrapper.init({
  id: scConfig.clientID,
  secret: scConfig.clientSecret,
  uri: scConfig.callbackURL
});

router.get('/track', function(req, res, next) {
  DownloadTrack.findById(req.query.trackID)
    .populate('userid')
    .then(function(downloadTrack) {
      res.send(downloadTrack);
    })
    .then(null, next);
});

router.get('/trackByURL/:username/:title', function(req, res, next) {
  var trackDownloadUrl = rootURL + "/download/" + req.params.username + "/" + req.params.title
  DownloadTrack.findOne({
      trackDownloadUrl: trackDownloadUrl
    })
    .then(function(downloadTrack) {
      res.send(downloadTrack);
    })
    .then(null, next);
});

router.post('/tasks', function(req, res, next) {
  var body = req.body;
  scWrapper.setToken(body.token);
  var reqObj = {};
  if (body.like) {
    scWrapper.request({
      method: 'PUT',
      path: '/me/favorites/' + body.trackID,
      qs: {
        oauth_token: body.token
      }
    }, function(err, response) {
      if (err) console.log('error liking: ' + JSON.stringify(err));
    });
  }
  if (body.repost) {
    scWrapper.request({
      method: 'PUT',
      path: '/e1/me/track_reposts/' + body.trackID,
      qs: {
        oauth_token: body.token
      }
    }, function(err, response) {
      if (err) console.log('error reposting the track: ' + JSON.stringify(err));
    });
  }
  if (body.comment) {
    scWrapper.request({
      method: 'GET',
      path: '/tracks/' + body.trackID,
      qs: {
        oauth_token: body.token
      }
    }, function(err, data) {
      if (err) console.log(err);
      else {
        var timestamp = Math.floor((Math.random() * data.duration));
        scWrapper.request({
          method: 'POST',
          path: '/tracks/' + body.trackID + '/comments',
          qs: {
            oauth_token: body.token,
            'comment[body]': body.commentText,
            'comment[timestamp]': timestamp
          }
        }, function(err, data) {
          if (err) console.log('error commenting: ' + JSON.stringify(err));
        });
      }
    });
  }
  if (body.artists) {
    body.artists.forEach(function(artist) {
      scWrapper.request({
        method: 'PUT',
        path: '/me/followings/' + artist.id,
        qs: {
          oauth_token: body.token
        }
      }, function(err, response) {
        if (err) console.log('error following added artist: ' + JSON.stringify(err));
      });
    });
  }
  if (body.userid) {
    User.findOne({
      _id: body.userid
    }).then(function(user) {
      if (user.admin) {
        request.get('http://52.26.54.198:1030/api/bots/randomBot', function(err, res, body) {
          if (!err) {
            scWrapper.request({
              method: 'PUT',
              path: '/me/followings/' + body.id,
              qs: {
                oauth_token: body.token
              }
            }, function(err, response) {
              if (err) console.log('error following a permanet: ' + JSON.stringify(err));
            });
          }
        });
      }
      for (var i = 0; i < 7; i++) {
        var artist = user.permanentLinks[i];
        if (artist) {
          scWrapper.request({
            method: 'PUT',
            path: '/me/followings/' + artist.id,
            qs: {
              oauth_token: body.token
            }
          }, function(err, response) {
            if (err) console.log('error following a permanet: ' + JSON.stringify(err));
          });
        }
      }
      if (user.permanentLinks.length > 7) {
        setTimeout(function() {
          for (var i = 7; i < user.permanentLinks.length; i++) {
            var artist = user.permanentLinks[i];
            if (artist) {
              scWrapper.request({
                method: 'PUT',
                path: '/me/followings/' + artist.id,
                qs: {
                  oauth_token: body.token
                }
              }, function(err, response) {
                if (err) console.log('error following a permanet: ' + JSON.stringify(err));
              });
            }
          }
        }, 30 * 60 * 1000)
      }
    });
  }
  if (body.artistID) {
    scWrapper.request({
      method: 'PUT',
      path: '/me/followings/' + body.artistID,
      qs: {
        oauth_token: body.token
      }
    }, function(err, response) {
      if (err) console.log('error following main artist: ' + JSON.stringify(err));
    });
  }
  if (body.playlists) {
    body.playlists.forEach(function(playlist) {
      scWrapper.request({
        method: 'PUT',
        path: '/e1/me/playlist_reposts/' + playlist.id,
        qs: {
          oauth_token: body.token
        }
      }, function(err, data) {
        if (err) console.log('error reposting a playlist: ' + JSON.stringify(err))
      });
      scWrapper.request({
        method: 'PUT',
        path: '/e1/me/playlist_likes/' + playlist.id,
        qs: {
          oauth_token: body.token
        }
      }, function(err, data) {
        if (err) console.log('error liking a playlist: ' + JSON.stringify(err))
      });
    });
  }
  DownloadTrack.findById(body._id)
    .then(function(t) {
      if (t.downloadCount) t.downloadCount++;
      else t.downloadCount = 1;
      t.save();
      res.end();
    })
});

router.get('/track/recent', function(req, res, next) {
  var userID = req.query.userID;
  var trackID = req.query.trackID;
  DownloadTrack.find({
      userid: userID
    }).sort({
      createdOn: -1
    }).limit(10)
    .then(function(downloadTracks) {
      var tracks = downloadTracks.filter(function(item) {
        return item._id.toString() !== trackID;
      });
      res.send(tracks);
      return res.end();
    })
    .then(null, next);
});

router.post('/linkDLTracks', function(req, res, next) {
  DownloadTrack.find({})
    .then(function(tracks) {
      tracks.forEach(function(track) {
        User.findOneAndUpdate({
          'soundcloud.id': track.artistID
        }, {
          $set: {
            'soundcloud.permalinkURL': track.artistURL,
            'soundcloud.id': track.artistID,
            'soundcloud.username': track.artistUsername,
            name: track.artistUsername,
            queue: []
          }
        }, {
          new: true,
          upsert: true
        }, function(err, user) {
          console.log("------------")
          track.userid = user._id;
          track.save();
          console.log(user);
          console.log(track);

        });
      })
    })
});

router.post("/instagram/follow_user", function(req, res, done) {

  var access_token = req.body.access_token;
  var accessTokenUrl = 'https://api.instagram.com/v1/users/search?q=' + req.body.q + '&access_token=' + access_token + '&count=1';

  var params = {

  };

  request.get({
    url: accessTokenUrl,
    form: params,
    json: true
  }, function(error, response, body) {

    if (body.data.length > 0) {
      request.post({
        url: 'https://api.instagram.com/v1/users/' + body.data[0].id + '/relationship?access_token=' + access_token,
        form: {
          'action': 'follow'
        },
        json: true
      }, function(error, response, body) {

        if (body.data.outgoing_status && body.data.outgoing_status == "requested") {
          res.json({
            'succ': true
          });
        } else {
          res.json({
            'succ': false,
            'msg': 'error following instagram user.'
          });
        }

      });

    } else {
      res.json({
        'succ': false,
        'msg': 'instagram user not found'
      });
    }
  });
});

router.post('/auth/instagram', function(req, res, done) {
  var accessTokenUrl = 'https://api.instagram.com/oauth/access_token';
  var params = {
    client_id: env.INSTAGRAM.clientID,
    client_secret: env.INSTAGRAM.clientSecret,
    redirect_uri: env.INSTAGRAM.callbackUrl,
    code: req.body.code,
    grant_type: 'authorization_code'
  };
  request.post({
    url: accessTokenUrl,
    form: params,
    json: true
  }, function(error, response, body) {
    res.json(response.body.access_token);
  });
});


// For Twitter API

router.post("/twitter/auth", function(req, res, done) {

  var requestTokenUrl = 'https://api.twitter.com/oauth/request_token';
  //var accessTokenUrl = 'https://api.twitter.com/oauth2/token';
  var accessTokenUrl = 'https://api.twitter.com/oauth/access_token';
  var profileUrl = 'https://api.twitter.com/1.1/users/lookup.json?screen_name=';

  // Part 1 of 2: Initial request from Satellizer.
  if (!req.body.oauth_token || !req.body.oauth_verifier) {
    var requestTokenOauth = {
      consumer_key: env.TWITTER.consumerKey,
      consumer_secret: env.TWITTER.consumerSecret,
      callback: env.TWITTER.callbackUrlDL,
    };

    // Step 1. Obtain request token for the authorization popup.
    request.post({
      url: requestTokenUrl,
      oauth: requestTokenOauth
    }, function(err, response, body) {
      var oauthToken = qs.parse(body);
      res.send(oauthToken);
    });
  } else {
    // Part 2 of 2: Second request after Authorize app is clicked.
    var accessTokenOauth = {
      consumer_key: env.TWITTER.consumerKey,
      consumer_secret: env.TWITTER.consumerSecret,
      token: req.body.oauth_token,
      verifier: req.body.oauth_verifier
    };

    request.post({
      url: accessTokenUrl,
      oauth: accessTokenOauth
    }, function(err, response, accessToken) {
      if (!err) {
        //console.log(req.header('Authorization'));
        accessToken = qs.parse(accessToken);
        res.send(accessToken);
      } else {
        console.log("Error from twitter callbacks" + err);
      }
    });

  }
});

router.post("/twitter/follow", function(req, res, done) {
  //console.log("request body <downloadTracks.js>:"+"\n"+JSON.stringify(req.params)+"\n"+JSON.stringify(req.body)+"\n"+JSON.stringify(req.query));
  var followUrl = 'https://api.twitter.com/1.1/friendships/create.json?screen_name=' + req.body.screen_name;
  var profileOauthData = {
    consumer_key: env.TWITTER.consumerKey,
    consumer_secret: env.TWITTER.consumerSecret,
    token: req.body.accessToken.oauth_token,
    token_secret: req.body.accessToken.oauth_token_secret
  };
  request.post({
    url: followUrl,
    oauth: profileOauthData
  }, function(err, response, follow) {
    if (!err) {
      DownloadTrack.findById(req.body.trackID)
        .then(function(t) {
          if (t.downloadCount) t.downloadCount++;
          else t.downloadCount = 1;
          t.save();
        })
      res.send(follow);
    } else {
      console.log("Error from twitter oauth login attempt " + err);
    }
  });
});

router.post("/twitter/post", function(req, res, done) {
  var profileOauthData = {
    consumer_key: env.TWITTER.consumerKey,
    consumer_secret: env.TWITTER.consumerSecret,
    token: req.body.oauth_token,
    token_secret: req.body.oauth_token_secret
  };
  var tweetUrl = 'https://api.twitter.com/1.1/statuses/update.json?status=';
  var tweetReqURL = tweetUrl + encodeURIComponent(req.body.socialPlatformValue);
  request.post({
    url: tweetReqURL,
    oauth: profileOauthData
  }, function(err, response, tweet) {
    if (!err) {
      DownloadTrack.findById(req.body.trackID)
        .then(function(t) {
          if (t.downloadCount) t.downloadCount++;
          else t.downloadCount = 1;
          t.save();
        })
      res.send(tweet);
    } else {
      done(err);
    }
  });
});

// For Youtube
router.get("/callbacksubscribe", function(req, res, next) {
  YoutubeOauth.getToken(req.query.code, function(err, tokens) {
    if (err) {
      next(err);
    }
    YoutubeOauth.setCredentials(tokens);
    // Youtube subscribed to channel
    if (typeof req.session.channelIDS == "string") {
      var channel = req.session.channelIDS;
      req.session.channelIDS = [];
      req.session.channelIDS.push(channel);
    }
    req.session.channelIDS.forEach(function(id) {
      var options = {
        uri: 'https://www.googleapis.com/youtube/v3/subscriptions?part=snippet',
        method: 'POST',
        json: {
          "snippet": {
            "resourceId": {
              "channelId": id,
              "kind": "youtube#channel"
            }
          }
        },
        headers: {
          "Authorization": "Bearer " + tokens.access_token
        }
      };
      request(options, function(error, response, body) {
        if (error || body.error) console.log('Error subscribing to youtube account: ' + error || body.error);
      });
    })
    res.redirect(req.session.downloadURL);
  });
});

router.get("/subscribe", function(req, res, next) {
  req.session.downloadURL = req.query.downloadURL;
  req.session.channelIDS = req.query.channelIDS;
  YoutubeOauth = Youtube.authenticate({
    type: "oauth",
    client_id: env.YOUTUBE.CLIENT_ID,
    client_secret: env.YOUTUBE.CLIENT_SEC,
    redirect_url: env.YOUTUBE.REDIRECT_URL_SUBSCRIBE
  });

  DownloadTrack.findById(req.query.trackID)
    .then(function(t) {
      if (t.downloadCount) t.downloadCount++;
      else t.downloadCount = 1;
      t.save();
    })

  res.json({
    msg: "Redirected to youtube authentication",
    url: YoutubeOauth.generateAuthUrl({
      access_type: "online",
      scope: ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtubepartner", "https://www.googleapis.com/auth/youtube", "https://www.googleapis.com/auth/youtube.force-ssl"]
    })
  });
});