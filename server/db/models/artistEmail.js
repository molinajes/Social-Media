var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    email: {
        type: String
    }
});

mongoose.model("ArtistEmail", schema);