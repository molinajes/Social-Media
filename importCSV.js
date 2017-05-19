var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/newEmails');
var csv = require('csv-parser')
var fs = require('fs')

var Schema = mongoose.Schema;
var SCEmailsSchema = new Schema({
  email: {
    type: String,
    unique: true
  },
  numTracks: Number,
  artist: Boolean,
  soundcloudID: Number,
  soundcloudURL: String,
  username: String,
  followers: Number,
  randomDay: Number,
  scanned: Boolean
});

var SCEmails = mongoose.model('scemails_with_members', SCEmailsSchema);

var db = mongoose.connection;

db.on('error', function(err) {
  console.log('connection error', err);
});

db.once('open', function() {
  console.log('connected.');

  fs.createReadStream('unsubscribed_export.csv')
    .pipe(csv())
    .on('data', function(data) {
      SCEmails.findOne({
        email: data["Email Address"]
      }).then(function(email) {
        email.remove();
      });
    })
});