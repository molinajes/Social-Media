var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    channelID: {
        type: Number
    },
    url: {
        type: String
    },
    displayName: {
        type: String
    },
    price: {
        type: Number
    },
    accessToken: {
        type: String
    },
    queue: {
        type: [Number]
    },
    blockRelease: {
        type: Date
    },
    followerCount: {
        type: Number
    }
});

mongoose.model("Channel", schema);