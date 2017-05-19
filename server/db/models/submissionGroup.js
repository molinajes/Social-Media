var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  title: String,
  submissionPageCustom: {
    heading: {
      text: String,
      style: {
        fontSize: Number,
        fontColor: String,
        fontWeight: String
      }
    },
    subHeading: {
      text: String,
      style: {
        fontSize: Number,
        fontColor: String,
        fontWeight: String
      }
    },
    inputFields: {
      style: {
        border: Number,
        borderRadius: Number,
        placeHolder: String,
        borderColor: String,
      }
    },
    button: {
      text: String,
      style: {
        fontSize: Number,
        fontColor: String,
        border: Number,
        borderRadius: Number,
        bgColor: String
      }
    },
    backgroundImage: {
      type: String
    }
  },
  customEmails: []
});

mongoose.model("SubmissionGroup", schema);