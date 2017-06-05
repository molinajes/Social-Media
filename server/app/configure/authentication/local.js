'use strict';
var passport = require('passport');
var _ = require('lodash');
var LocalStrategy = require('passport-local').Strategy;
var mongoose = require('mongoose');
var User = mongoose.model('User');
var thirdpartyuser = mongoose.model('thirdpartyuser');

module.exports = function(app) {

  // When passport.authenticate('local') is used, this function will receive
  // the email and password to run the actual authentication logic.
  var strategyFn = function(email, password, done) {
    User.findOne({
        email: email,
        "$or": [{
          "role": "superadmin"
        }, {
          "role": "admin"
        }]
      })
      .then(function(user) {
        // user.correctPassword is a method from the User schema.
        // if (!user || !user.correctPassword(password)) {
        if (!user || !user.correctPassword(password)) {
          done(null, false);
        } else {
          // Properly authenticated.
          done(null, user);
        }
      }, function(err) {
        done(err);
      });
  };

  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, strategyFn));

  var substrategyFn = function(email, password, done) {
    console.log("rascal substrategyFn");
    thirdpartyuser.findOne({
        "email": email
      })
      .then(function(thirdpartyuser) {
        console.log("rascal sub login find");  
        console.log(thirdpartyuser);   
        console.log(password);
        /*console.log(thirdpartyuser.password + "dbpassword");
        var temppw = thirdpartyuser.generateSalt();
        
        console.log(thirdpartyuser.encryptPassword(password, temppw) + "currentpassword");
        console.log(thirdpartyuser);   */
        // user.correctPassword is a method from the User schema.
        // if (!user || !user.correctPassword(password)) {
        if (!thirdpartyuser || password!=thirdpartyuser.password) {
          console.log("rascal uncorrectpassword");
          console.log(thirdpartyuser);
          done(null, false);
        } else {
          // Properly authenticated.
          console.log("rascal correctPassword");
          console.log(thirdpartyuser);
          done(null, thirdpartyuser);
        }
      }, function(err) {
        console.log("rascal login error");
        done(err);
      });
  };

  passport.use('local-sublogin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, substrategyFn));

  // A POST /login route is created to handle login.
  // app.post('/login', function(req, res, next) {

  //     var authCb = function(err, user) {

  //         if (err) return next(err);

  //         if (!user) {
  //             var error = new Error('Invalid login credentials.');
  //             error.status = 401;
  //             return next(error);
  //         }

  //         // req.logIn will establish our session.
  //         req.logIn(user, function(loginErr) {
  //             if (loginErr) return next(loginErr);
  //             // We respond with a response object that has user with _id and email.
  //             res.status(200).send({
  //                 user: user.sanitize()
  //             });
  //         });
  //     };
  //     passport.authenticate('local', authCb)(req, res, next);
  // });

};
