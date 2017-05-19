var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    email: {
        type: String
    },
    name: {
        type: String
    }
});

mongoose.model("Email", schema);