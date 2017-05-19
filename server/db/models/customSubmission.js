'use strict';
var mongoose = require('mongoose');
var schema = new mongoose.Schema({
  userID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  background: {
    images: String,
    blur: Number
  },
  logo: {
    images: String,
    align: String
  },
  heading: {
    text: String,
    style: {
      fontSize: Number,
      fontColor: String,
      fontFamily: String
    }
  },
  subHeading: {
    text: String,
    style: {
      fontSize: Number,
      fontColor: String,
      fontFamily: String
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
  },
  type: String,
  layout: String
});
mongoose.model('CustomSubmission', schema);