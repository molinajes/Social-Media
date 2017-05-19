var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  toRepostArray: {
    type: [{
      type: mongoose.Types.ObjectId,
      ref: 'RepostEvent'
    }]
  }
});

mongoose.model("Submission", schema);