'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    userID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    s3URL: {
        type: String
    },
    genre: {
        type: String
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
    status: {
        type: String,
        default: 'new'
    },
    trackLink: {
        type: String
    },
    submissionDate: {
        type: Date,
        default: new Date()
    }
});

mongoose.model('PremierSubmission', schema);