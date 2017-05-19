'use strict';
var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  messages: [],
  repeatFor: Number,
  p1: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    alert: String,
    slots: [],
    accepted: {
      type: Boolean,
      default: false
    },
    online: {
      type: Boolean,
      default: false
    }
  },
  p2: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    alert: String,
    slots: [],
    accepted: {
      type: Boolean,
      default: false
    },
    online: {
      type: Boolean,
      default: false
    }
  },
  unrepost: {
    type: Boolean,
    default: true
  }
});

mongoose.model('Trade', schema);