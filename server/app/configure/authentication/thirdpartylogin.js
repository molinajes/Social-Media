'use strict';
var passport = require('passport');
var _ = require('lodash');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var crypto = require('crypto');

module.exports = function(app) {
  var thirdPartyStrategyFn = function(req, username, password, done) {
    NetworkAccount
    User.findOne({
        'thirdPartyInfo.username': username
      })
      .then(function(user) {
        // user.correctPassword is a method from the User schema.      
        if (!user || !correctPassword(password, user.thirdPartyInfo.salt, user.thirdPartyInfo.password)) {
          return done(null, false);
        } else {
          // Properly authenticated.
          return done(null, user);
        }
      }, function(err) {
        done(err);
      });
  };

  passport.use('local-thirdParty', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  }, thirdPartyStrategyFn));

  var encryptPassword = function(plainText, salt) {
    var hash = crypto.createHash('sha1');
    hash.update(plainText);
    hash.update(salt);
    return hash.digest('hex');
  };

  var correctPassword = function(password, salt, dbpassword) {
    var encryptedpass = encryptPassword(password, salt);
    return encryptPassword(password, salt) === dbpassword;
  }

};