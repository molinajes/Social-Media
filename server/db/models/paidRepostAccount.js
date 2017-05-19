'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    scID: {
        type: Number
    },
    scURL: {
        type: String
    },
    username: {
        type: String
    },
    followers: {
        type: Number
    },
    description: {
        type: String
    }
});

mongoose.model('PaidRepostAccount', schema);