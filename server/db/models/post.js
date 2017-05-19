'use strict'
var mongoose = require('mongoose');

var postSchema = new mongoose.Schema({
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    postDate: {
        type: Date
    },
    facebookPost: {
        type: String,
        default: ""
    },
    twitterPost: {
        type: String,
        default: ""
    },
    youTubeDescription: {
        type: String,
        default: ""
    },
    youTubeTitle: {
        type: String,
        default: ""
    },
    soundCloudDescription: {
        type: String,
        default: ""
    },
    soundCloudTitle: {
        type: String,
        default: ""
    },
    awsAudioKeyName: {
        type: String,
        default: ""
    },
    awsVideoKeyName: {
        type: String,
        default: ""
    },
    released:{
        type :Boolean,
        default:false
    }
}, { strict: false });

mongoose.model('Posts', postSchema);