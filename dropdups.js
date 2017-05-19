var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/songScheduler');

var Schema = mongoose.Schema;
var SCEmailsSchema = new Schema({
  email: String,
  numTracks: Number,
  artist: Boolean,
  soundcloudID: Number,
  soundcloudURL: String,
  username: String,
  followers: Number,
  randomDay: Number
});

var SCEmails = mongoose.model('SCEmails', SCEmailsSchema);

var SCEmailsSchema2 = new Schema({
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
  randomDay: Number
});

var SCEmails2 = mongoose.model('SCEmails2', SCEmailsSchema2);

var db = mongoose.connection;

db.on('error', function(err) {
  console.log('connection error', err);
});

db.once('open', function() {
  console.log('connected.');

  dropDups();
});

function dropDups() {
  var i = 0;
  SCEmails.find({})
    .then(function(users) {
      users.forEach(function(user) {
        delete user._id;
        var newEmail = new SCEmails2(user);
        newEmail.save().then(console.log, console.log);
        i++;
        if (i == 20) {
          console.log('done');
        }
      })
    });

}