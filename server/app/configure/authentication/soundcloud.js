'use strict';
var passport = require('passport');
var _ = require('lodash');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var scConfig = global.env.SOUNDCLOUD;
var scWrapper = require("../../SCWrapper/SCWrapper.js");
scWrapper.init({
  id: scConfig.clientID,
  secret: scConfig.clientSecret,
  uri: scConfig.callbackURL
});

module.exports = function(app) {
  var strategyFn = function(req, email, password, done) {
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
        .then(function(data) {
          done(null, data);
        }).then(null, done);
    });
  };

  passport.use('local-soundcloud', new LocalStrategy({
    usernameField: 'token',
    passwordField: 'password',
    passReqToCallback: true
  }, strategyFn));
};
