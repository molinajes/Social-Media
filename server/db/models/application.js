var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    firstName: {
        type: String
    },
    lastName: {
        type: String
    },
    email: {
        type: String
    }
});

mongoose.model("Application", schema);