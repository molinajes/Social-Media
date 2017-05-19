'use strict';
var passport = require('passport');
var _ = require('lodash');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');

module.exports = function(app) {

  var strategyFn = function(req, email, password, done) {
    User
      .findOne({
        email: email
      })
      .then(function(user) {
        if (user) {
          return done(null, false);
        }
        var newUser = new User({
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          role: 'user'
        });
        return newUser.save();
      })
      .then(function(newUser){
        done(null, newUser);
      })
      .then(null, function(err) {
        done(err);
      });
  };

  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  }, strategyFn));
};