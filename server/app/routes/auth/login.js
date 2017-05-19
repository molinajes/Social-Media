'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Channel = mongoose.model('Channel');
var Submission = mongoose.model('Submission');
var User = mongoose.model('User');
var passport = require('passport');
var https = require('https');
var request = require('request');
var scConfig = global.env.SOUNDCLOUD;
var scWrapper = require("../../SCWrapper/SCWrapper.js");
var jwt = require('jsonwebtoken');

router.post('/', function(req, res, next) {
  passport.authenticate('local-login', function(err, user, info) {
    if (err) {
      return res.json({
        success: false,
        "message": err
      });
    }
    if (!user) {
      return res.json({
        success: false,
        "message": "Invalid Username or Password"
      });
    } else {
      req.login(user, function(err) {
        //if(req.body.rememberme && (req.body.rememberme == "1" || req.body.rememberme == 1)){
        //req.session.cookie.expires = false;
        req.session.name = user.userid;
        req.session.cookie.expires = new Date(Date.now() + (6 * 3600000));
        req.session.cookie.maxAge = 6 * 3600000;
        //req.session.cookie.expires = false;
        delete user.password;
        delete user.salt;
        return res.json({
          'success': true,
          'message': '',
          'user': user
        });
      });
    }
  })(req, res);
});


router.post('/thirdPartylogin', function(req, res, next) {
  passport.authenticate('local-thirdParty', function(err, user, info) {
    if (err) {
      return res.json({
        success: false,
        "message": err
      });
    }
    if (!user) {
      return res.json({
        success: false,
        "message": "Invalid Username or Password"
      });
    } else {
      req.login(user, function(err) {
        //if(req.body.rememberme && (req.body.rememberme == "1" || req.body.rememberme == 1)){
        //req.session.cookie.expires = false;
        req.session.name = user.userid;
        req.session.cookie.expires = new Date(Date.now() + (24 * 3600000));
        req.session.cookie.maxAge = 24 * 3600000;
        //req.session.cookie.expires = false;
        delete user.password;
        delete user.salt;
        return res.json({
          'success': true,
          'message': '',
          'user': user
        });
      });
    }
  })(req, res);
});

router.post('/authenticated', function(req, res, next) {
  scWrapper.init({
    id: scConfig.clientID,
    secret: scConfig.clientSecret,
    uri: scConfig.callbackURL
  });
  var reqObj = {
    method: 'GET',
    path: '/me',
    qs: {}
  };
  scWrapper.setToken(req.body.token);
  scWrapper.request(reqObj, function(err, data) {
    if (err) {
      next(err);
    } else {
      var sendObj = {};
      Channel.findOneAndUpdate({
          channelID: data.id
        }, {
          accessToken: req.body.token,
          followerCount: data.followers_count,
          price: parseFloat(data.followers_count / 3000.0).toFixed(2)
        })
        .then(function(channel) {
          sendObj.channel = channel;
          return Event.find({
            channelID: data.id
          });
        })
        .then(function(events) {
          sendObj.events = events;
          return Submission.find({
            channelIDS: data.id
          });
        })
        .then(function(submissions) {
          sendObj.submissions = submissions;
          res.send(sendObj);
        })
        .then(null, next);
    }
  });
});

router.post('/soundCloudLogin', function(req, res, next) {
  passport.authenticate('local-soundcloud', function(err, user, info) {
    if (err) {
      next(err);
    }
    if (!user) {
      next(err);
    } else {
      req.login(user, function(err) {
        //req.session.cookie.expires = false;
        req.session.name = user.userid;
        req.session.cookie.expires = new Date(Date.now() + (24 * 3600000));
        req.session.cookie.maxAge = 24 * 3600000;
        //req.session.cookie.expires = false;
        return res.json({
          'success': true,
          'message': '',
          'user': user
        });
      });
    }
  })(req, res);
});


router.post('/soundCloudAuthentication', function(req, res, next) {
  scWrapper.setToken(req.body.token);
  var reqObj = {
    method: 'GET',
    path: '/me',
    qs: {}
  };
  scWrapper.request(reqObj, function(err, user) {
    if (err) {
      return done(err, false);
    }
    var updateUser = {
      'name': user.username,
      'soundcloud': {
        'token': req.body.token,
        'id': user.id,
        'username': user.username,
        'permalinkURL': user.permalink_url,
        'avatarURL': user.avatar_url.replace('large', 't500x500'),
        'followers': user.followers_count,
        'pseudoname': user.permalink_url.substring(user.permalink_url.indexOf('.com/') + 5),
      },
    }
    User.findOneAndUpdate({
        'soundcloud.id': user.id
      }, updateUser, {
        upsert: true,
        new: true
      })
      .then(function(user) {
        return res.json({
          'success': true,
          'message': '',
          'user': user
        });
      }).then(null, next);
  });
});

/*
Client Secrets
Google -
{
client id:923811958466-kthtaatodor5mqq0pf5ub6km9msii82g.apps.googleusercontent.com
client secret:K4wliD3PsnjdS0o-CKTNokjv
}
*/
router.post('/google', function(req, res, next) {
  request.post({
    url: 'https://www.googleapis.com/oauth2/v4/token',
    form: {
      code: req.body.code,
      client_id: '923811958466-kthtaatodor5mqq0pf5ub6km9msii82g.apps.googleusercontent.com',
      client_secret: 'K4wliD3PsnjdS0o-CKTNokjv',
      redirect_uri: req.body.redirectUri,
      grant_type: 'authorization_code'
    }
  }, function(err, response, body_token) {
    if (err) return console.log("<google,login.js>Error while getting access token from code :" + JSON.stringify(err));
    //create entries into database under users authorization table
    body_token = JSON.parse(body_token);
    request.get({
      url: 'https://www.googleapis.com/youtube/v3/channels?part=contentOwnerDetails,brandingSettings,contentDetails&mine=true&access_token=' + body_token.access_token
    }, function(err, response, body) {
      //prompt user to select an appropiate channel
      if (err) return console.log("<google,login.js>Error while getting statistics from Google API :" + JSON.stringify(err));
      body = JSON.parse(body);
      body_token.isValid = false;
      var AuthTokens = mongoose.model("AuthTokens");
      AuthTokens.update({
        userid: req.user._id
      }, {
        userid: req.user._id,
        youtube: body_token
      }, {
        upsert: true
      }, function(err, nMod) {
        if (err) return console.log("<google,login.js>Error while pushing access tokens to database" + JSON.stringify(err));
        var channels = {};
        for (var i = 0; i < body.items.length; i++) {
          channels[body.items[i].id] = body.items[i].brandingSettings.channel.title;
        }
        res.send(channels);
      });
    });
  });
});
