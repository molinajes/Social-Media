var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  artist: {
    type: Boolean
  },
  scID: {
    type: Number
  },
  scURL: {
    type: String
  },
  name: {
    type: String
  },
  username: {
    type: String
  },
  followers: {
    type: Number
  },
  email: {
    type: String
  },
  description: {
    type: String
  },
  numTracks: {
    type: String
  },
  facebookURL: {
    type: String
  },
  instagramURL: {
    type: String
  },
  twitterURL: {
    type: String
  },
  youtubeURL: {
    type: String
  },
  emailDayNum: {
    type: Number
  },
  genre: {
    type: String
  },
  allEmails: {
    type: [String]
  },
  websites: {
    type: String
  }
});

mongoose.model("Follower", schema);