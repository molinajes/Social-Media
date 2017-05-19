'use strict';

var router = require('express').Router();

module.exports = router;

var mongoose = require('mongoose');
var ArtistEmail = mongoose.model('ArtistEmail');
var Application = mongoose.model('Application');

var sendEmail = require("../../mandrill/sendEmail.js");

router.post('/application', function(req, res, next) {

  var applicationObj = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email
  };

  Application
    .find({
      email: applicationObj.email
    })

  .then(function(result) {
      if (result.length > 0) {
        return res.status(400).end();
      }

      var newApplication = new Application({
        'firstName': applicationObj.firstName,
        'lastName': applicationObj.lastName,
        'email': applicationObj.email,
      });
      return newApplication.save();
    })
    .then(function(result) {
      var emailBody = '<b>First Name: </b> ' + applicationObj.firstName +
        '<br />' +
        '<br />' +
        '<b>Last Name: </b> ' + applicationObj.lastName +
        '<br />' +
        '<br />' +
        '<b>Email: </b> ' + applicationObj.email +
        '<br />' +
        '<br />';
      sendEmail('Edward', 'edward@peninsulamgmt.com', 'Artists Unlimited', 'coayscue@artistsunlimited.com', 'Application Submission', emailBody);
      res.end();
    })
    .then(null, function(err) {
      next(err);
    });
});

router.post('/ay', function(req, res, next) {
  console.log('ay');
  res.send('ay');
})

router.post('/artistemail', function(req, res, next) {

  var email = req.body.email;

  ArtistEmail
    .find({
      email: email
    })

  .then(function(result) {
      if (result.length > 0) {
        return res.status(400).end();
      }

      var newEmail = new ArtistEmail({
        'email': email,
      });
      return newEmail.save();
    })
    .then(function(result) {
      var emailBody = '<b>Email: </b> ' + email +
        '<br />' +
        '<br />';

      sendEmail('Edward', 'edward@peninsulamgmt.com', 'Support', 'coayscue@artistsunlimited.com', 'Artist Email Submission', emailBody);
      res.end();
    })
    .then(null, function(err) {
      next(err);
    });
});