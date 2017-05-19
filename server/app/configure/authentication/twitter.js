'use strict';
// TWITTER'S ACCESS TOKENS NEVER EXPIRE!
var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;
var mongoose = require('mongoose');
var UserModel = mongoose.model('User');
var loggedInUser = null;
module.exports = function(app) {
  var twitterConfig = app.getValue('env').TWITTER;
  var twitterCredentials = {
    consumerKey: twitterConfig.consumerKey,
    consumerSecret: twitterConfig.consumerSecret,
    callbackURL: twitterConfig.callbackUrlAuth
  };

  var createNewUser = function(token, tokenSecret, profile) {
    return UserModel.create({
      twitter: {
        id: profile.id,
        username: profile.username,
        token: token,
        tokenSecret: tokenSecret
      }
    });
  };

  var updateUserCredentials = function(user, token, tokenSecret, profile) {
    user.twitter.id = profile.id;
    user.twitter.username = profile.username;
    user.twitter.token = token;
    user.twitter.tokenSecret = tokenSecret;
    return user.save();
  };

  var verifyCallback = function(token, tokenSecret, profile, done) {
    // I'm passing no search criteria because there will only be one user AND because Twitter doesn't provide a usedr email address by which to search for a user
    UserModel.findOne({
        _id: loggedInUser._id
      })
      .then(function(user) {
        if (user) {
          return updateUserCredentials(user, token, tokenSecret, profile);
        }
      }).then(function(user) {
        done(null, user);
      }, function(err) {
        console.error('Error creating user from Twitter authentication', err);
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

  passport.use(new TwitterStrategy(twitterCredentials, verifyCallback));
  app.get('/auth/twitter', passport.authenticate('twitter' /*, {scope:[]}*/ ));
  app.get('/auth/twitter/callback',
    passport.authenticate('twitter', {
      failureRedirect: '/login'
    }),
    function(req, res) {
      res.redirect('/artistTools/releaser');
    });
};