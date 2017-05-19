'use strict';
var path = require('path');
var express = require('express');
var app = express();
var unsubscribe = require('./configure/unsubscribe');
var passport = require('passport');
module.exports = app;

// Pass our express application pipeline into the configuration
// function located at server/app/configure/index.js
require('./configure')(app);

// Routes that will be accessed via AJAX should be prepended with
// /api so they are isolated from our GET /* wildcard.
app.use('/api', require('./routes'));


/*
 This middleware will catch any URLs resembling a file extension
 for example: .js, .html, .css
 This allows for proper 404s instead of the wildcard '/*' catching
 URLs that bypass express.static because the given file does not exist.
 */
app.use(function(req, res, next) {
  if (path.extname(req.path).length > 0) {
    res.status(404).end();
  } else {
    next(null);
  }
});

app.get('/unsubscribe/:followerId', function(req, res) {
  unsubscribe(req, res);
});

// app.get('/admin*', function(req, res) {
//   if (req.isAuthenticated() && req.user.role === 'admin') {
//     res.sendFile(app.get('indexHTMLPath'));
//   } else {
//     res.sendFile(app.get('loginHTMLPath'));
//   }
// });

app.get('/auth/soundcloud',
  passport.authenticate('soundcloud'),
  function(req, res) {

  });

app.get('/auth/soundcloud/callback', passport.authenticate('soundcloud', {
    failureRedirect: '/login'
  }),
  function(req, res) {
    res.redirect('/');
  });

// app.get('/*', function(req, res) {
//   res.sendFile(app.get('homeHTMLPath'));
// });

app.get('/*', function(req, res) {
  res.sendFile(app.get('indexHTMLPath'));
});

// Error catching endware.
app.use(function(err, req, res, next) {
  console.error(err)
  console.error(err.stack);
  res.status(err.status || 500).send(err.message || 'Internal server error.');
});