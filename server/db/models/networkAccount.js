'use strict';
var mongoose = require('mongoose');
var schema = new mongoose.Schema({
  channels: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});
mongoose.model('NetworkAccounts', schema);