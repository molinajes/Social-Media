var fs = require('fs');
var http = require('http');
var Promise = require('promise');
var mongoose = require('mongoose');
var scWrapper = require("./server/app/SCWrapper/SCWrapper.js");

mongoose.connect('mongodb://localhost/bots');
var schema = new mongoose.Schema({
  token: String,
  clientID: String,
  clientSecret: String,
  username: String,
  id: Number,
  url: String,
  description: String,
  full_name: String,
  city: String,
  email: String,
  password: String
});

var Bot = mongoose.model("Bot", schema);
var db = mongoose.connection;
db.on('error', function(err) {
  console.log('connection error', err);
});
db.once('open', function() {
  console.log('connected.');
  setTimeout(function() {
    scheduleReposts();
  }, parseFloat(process.env.HOURS_DELAY) * 60 * 60 * 1000)
});
var timeBetween = 60 * 60 * 1000 * parseFloat(process.env.HOURS_SPAN) / parseFloat(process.env.NUMBER_REPOSTS);
var totalReposts = 0;
console.log(timeBetween);

function scheduleReposts() {
  setTimeout(function() {
    if (totalReposts < process.env.NUMBER_REPOSTS) {
      scheduleReposts();
    }
  }, timeBetween);
  performRepost();
}

function performRepost() {
  if (totalReposts >= process.env.NUMBER_REPOSTS) return;
  Bot.find({})
    .then(function(bots) {
      var bot = bots[Math.floor(Math.random() * bots.length)];
      console.log(bot);
      scWrapper.init({
        id: bot.clientID,
        secret: bot.clientSecret,
        uri: 'https://localhost:1337',
        accessToken: bot.token
      });
      var reqObj = {
        method: 'PUT',
        path: '/e1/me/track_reposts/' + process.env.TRACK_ID,
        qs: {
          oauth_token: bot.token
        }
      };
      scWrapper.request(reqObj, function(err, response) {
        if (err) {
          console.log(err)
          console.log(response);
          performRepost();
        } else {
          console.log(response);
          if (response.status.includes('200 - OK')) {
            performRepost();
          } else {
            totalReposts++;
          }
        }
      });
    })
}