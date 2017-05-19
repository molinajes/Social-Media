var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  channelIDS: {
    type: Array,
    default: []
  },
  events: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event'
    }],
    default: []
  },
  email: {
    type: String
  },
  name: {
    type: String
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
  submissionDate: {
    type: Date,
    default: new Date()
  },
  payment: {
    type: Object
  },
  pooledPayment: {
    type: Object
  },
  paidChannels: {
    type: Array,
    default: []
  },
  paidPooledChannels: {
    type: Array,
    default: []
  },
  paid: {
    type: Boolean
  },
  discounted: {
    type: Boolean
  },
  refundDate: {
    type: Date
  },
  status: {
    type: String,
    default: "submitted"
  },
  pooledSendDate: {
    type: Date
  },
  pooledChannelIDS: {
    type: Array,
    default: []
  },
  ignoredBy: {
    type: Array,
    default: []
  },
  trackArtist: {
    type: String
  },
  trackArtistURL: {
    type: String
  },
  artworkURL: {
    type: String
  },
  genre: {
    type: String
  }
});

mongoose.model("Submission", schema);
