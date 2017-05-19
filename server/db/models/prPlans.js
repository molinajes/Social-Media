'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    s3URL: {
        type: String
    },
    budget: {
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
    }
});

mongoose.model('PrPlans', schema);