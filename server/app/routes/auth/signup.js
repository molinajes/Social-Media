'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var passport = require('passport');
router.post('/', function(req, res, next) {
  passport.authenticate('local-signup', function(err, user, info) {
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
      return res.json({
        'success': true,
        'message': '',
        'user': user
      });
    }
  })(req, res);
});