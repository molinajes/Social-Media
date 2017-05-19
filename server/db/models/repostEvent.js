var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  userID: {
    type: Number
  },
  trackID: {
    type: Number
  },
  title: {
    type: String
  },
  trackURL: {
    type: String
  },
  trackArtUrl: {
    type: String
  },
  day: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'track'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  unrepostDate: {
    type: Date,
    default: new Date(10)
  },
  email: {
    type: String
  },
  name: {
    type: String
  },
  comment: {
    type: String
  },
  like: {
    type: Boolean,
    default: false
  },
  saleID: String,
  price: Number,
  payout: {},
  artistName: String,
  otherChannels: [],
  timeGap: {},
  unrepostHours: {},
  pseudoname: {
    type: String
  }
});

mongoose.model("RepostEvent", schema);