'use strict';
var Promise = require('bluebird');
var path = require('path');
var chalk = require('chalk');

var DATABASE_URI = require(path.join(__dirname, '../env')).DATABASE_URI;

var mongoose = require('mongoose');
if (process.env.DEBUG == "ON") mongoose.set('debug', true);
// var db = mongoose.connect(DATABASE_URI).connection;

// Require our models -- these should register the model into mongoose
// so the rest of the application can simply call mongoose.model('User')
// anywhere the User model needs to be used.
require('./models');

// var startDbPromise = new Promise(function (resolve, reject) {
//     db.on('open', resolve);
//     db.on('error', reject);
// });

// console.log(chalk.yellow('Opening connection to MongoDB . . .'));
// startDbPromise.then(function () {
//     console.log(chalk.green('MongoDB connection opened!'));
// });

/*
 * The promise has to be returned in case of promise chaining. The 'open' and 'error' events are not fired
 * right now, may be due to version changes. For now this is a working solution.
 */

var startDbPromise = function() {
  return new Promise(function(resolve, reject) {
    mongoose.connect(DATABASE_URI, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};


module.exports = startDbPromise;