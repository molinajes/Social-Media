'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    email: {
        type: String
    },
    numTracks: {
        type: Number
    },
    artist: {
        type: Boolean
    },
    soundcloudID: {
        type: Number
    },
    soundcloudURL: {
        type: String
    },
    username: {
       type: String
    },
    followers: {
        type: Number
    },
    randomDay: {
        type: Number
    },
    scanned:{
        type: Boolean
    }
});

mongoose.model('SCEmails', schema);