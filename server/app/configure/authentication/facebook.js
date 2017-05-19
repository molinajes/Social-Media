'use strict';
var passport = require('passport');
var FacebookStrategy = require('passport-facebook').Strategy;
var Promise = require('bluebird');
var FB = require('fb');
var promisifiedFB = Promise.promisify(FB.napi, {
  context: FB
});
var mongoose = require('mongoose');
var UserModel = mongoose.model('User');
var loggedInUser = null;
module.exports = function(app) {
  var facebookConfig = app.getValue('env').FACEBOOK;
  var facebookCredentials = {
    clientID: facebookConfig.clientID,
    clientSecret: facebookConfig.clientSecret,
    callbackURL: facebookConfig.callbackURL
  };

  var extendAccessToken = function(shortTermToken) {
    return promisifiedFB(
      'oauth/access_token', {
        client_id: facebookCredentials.clientID,
        client_secret: facebookCredentials.clientSecret,
        grant_type: 'fb_exchange_token',
        fb_exchange_token: shortTermToken
      }
    );
  };

  var createNewUser = function(token, refreshToken, profile) {
    return UserModel.create({
      facebook: {
        id: profile.id,
        token: token,
        refreshToken: refreshToken,
        name: profile.displayName
      }
    });
  };

  var updateUserCredentials = function(user, token, refreshToken, profile) {
    user.facebook.id = profile.id;
    user.facebook.name = profile.displayName;
    user.facebook.token = token;
    user.facebook.refreshToken = refreshToken;
    return user.save();
  };

  var verifyCallback = function(shortTermToken, refreshToken, profile, done) {
    extendAccessToken(shortTermToken)
      .then(function(response) {
        var extendedToken = response.access_token;
        UserModel.findOne({
            _id: loggedInUser._id
          })
          .then(function(user) {
            if (user) {
              return updateUserCredentials(user, extendedToken, refreshToken, profile);
            }
          }).then(function(userToLogin) {
            done(null, userToLogin);
          }, function(err) {
            console.error('Error creating user from Facebook authentication', err);
            done(err);
          });
      });
  };

  /*
   * Get information of Logged In user
   */
  app.use(function(req, res, next) {
    loggedInUser = req.user;
    next();
  });
  passport.use(new FacebookStrategy(facebookCredentials, verifyCallback));
  app.get('/auth/facebook', passport.authenticate('facebook', {
    scope: ['publish_actions', 'manage_pages', 'publish_pages']
  }));
  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
      failureRedirect: '/login'
    }),
    function(req, res) {
      res.redirect('/artistTools/releaser');
    }
  );
};