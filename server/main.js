'use strict';
var chalk = require('chalk');
var socketio = require('socket.io');
// Requires in ./db/index.js -- which returns a promise that represents
// mongoose establishing a connection to a MongoDB database.
var startDb = require('./db');
var fs = require('fs');
var path = require('path');

var options = {
  key: fs.readFileSync(path.join(__dirname, './keys/domain.key')),
  cert: fs.readFileSync(path.join(__dirname, './keys/artistsunlimited_com.crt')),
  ca: fs.readFileSync(path.join(__dirname, './keys/artistsunlimited_com.ca-bundle'))
};

// Create a node server instance! cOoL!
var secureServer = require('https').createServer(options);

var createApplication = function() {
  var app = require('./app');
  secureServer.on('request', app); // Attach the Express application.
  var io = socketio(secureServer);
  require('./io')(io); // Attach socket.io.
  require('./io/notifications')(io);
};

var startServer = function() {
  var HTTPS_PORT = process.env.HTTPS_PORT || 1443;

  secureServer.listen(HTTPS_PORT, function() {
    console.log(chalk.blue('Secure server started on port', chalk.magenta(HTTPS_PORT)));
  });
};

var startexpress = function() {
  var expressApp = require('express')();

  expressApp.get('*', function(req, res) {
    res.redirect('https://' + req.hostname + req.url)
  });
  var HTTP_PORT = process.env.HTTP_PORT || 1337;
  expressApp.listen(HTTP_PORT);
};

startDb().then(createApplication).then(startServer).then(startexpress).catch(function(err) {
  console.error(chalk.red(err.stack));
  process.kill(1);
});