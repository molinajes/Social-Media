'use strict';
var passport = require('passport');
var InstagramStrategy = require('passport-instagram').Strategy;
var Promise = require('bluebird');
var mongoose = require('mongoose');
var UserModel = mongoose.model('User');
var loggedInUser = null;
module.exports = function(app) {
  var instagramConfig = app.getValue('env').INSTAGRAM;

  var instagramCredentials = {
    clientID: instagramConfig.clientID,
    clientSecret: instagramConfig.clientSecret,
    callbackURL: instagramConfig.callbackURL
  };

  var createNewUser = function(token, refreshToken, profile) {
    console.log("profile", profile);
    return UserModel.create({
      instagram: {
        id: profile.id,
        token: token,
        refreshToken: refreshToken,
        name: profile.displayName
      }
    });
  };

  var updateUserCredentials = function(user, token, refreshToken, profile) {
    user.instagram.id = profile.id;
    user.instagram.name = profile.displayName;
    user.instagram.token = token;
    user.instagram.refreshToken = refreshToken;
    return user.save();
  };

  var verifyCallback = function(accessToken, refreshToken, profile, done) {
    console.log("profile", profile);
    UserModel.findOne({
        _id: loggedInUser._id
      })
      .then(function(user) {
        if (user) {
          return updateUserCredentials(user, accessToken, refreshToken, profile);
        }
      })
      .then(function(userToLogin) {
        done(null, userToLogin);
      }, function(err) {
        console.error('Error creating user from instagram authentication', err);
        done(err);
      });
  };
  /*
   * Get information of Logged In user
   */
  app.use(function(req, res, next) {
    loggedInUser = req.user;
    next();
  });
  passport.use(new InstagramStrategy({
    clientID: "50d858ead5e345e18ef23e92ef3d9f2c",
    clientSecret: "cc19b9c7e2824cfeb53fb4711b718823",
    callbackURL: "https://localhost:1443/auth/instagram/callback"
  }, verifyCallback));
  app.get('/auth/instagram',
    passport.authenticate('instagram'));

  app.get('/auth/instagram/callback',
    passport.authenticate('instagram', {
      failureRedirect: '/login'
    }),
    function(req, res) {
      res.redirect('/artistTools/releaser');
    });
};