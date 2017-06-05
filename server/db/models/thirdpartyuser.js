var mongoose = require('mongoose');
var crypto = require('crypto');

var schema = new mongoose.Schema({
  role: {
    type: String,
    default: 'admin'
  },
  name: {
    type: String
  },
  admin:{
  	type: Boolean,
    default: true
  },
  email: {
    type: String
  },  
  password:{
  	type: String
  },
  paidRepost: [{
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    price: {
      type: Number,
      default: 10
    },
    description: {
      type: String,
      default: ''
    },
    groups: {
      type: Array,
      default: []
    },
    submissionUrl: String,
    premierUrl: String,
    createdOn: {
      type: Date,
      default: new Date()
    },
    linkInBio: {
      type: Boolean
    }
  }],
  astzOffset: {
    type: Number,
    default: -300
  },
  linkedaccount: [{
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    price: {
      type: Number,
      default: 10
    },
    description: {
      type: String,
      default: ''
    },
    groups: {
      type: Array,
      default: []
    },
    submissionUrl: String,
    premierUrl: String,
    createdOn: {
      type: Date,
      default: new Date()
    },
    linkInBio: {
      type: Boolean
    }
  }]
});

/*var generateSalt = function() {
  return crypto.randomBytes(16).toString('base64');
};

var encryptPassword = function(plainText, salt) {
  var hash = crypto.createHash('sha1');
  hash.update(plainText);
  hash.update(salt);
  return hash.digest('hex');
};

schema.pre('save', function(next) {
  if (this.isModified('password')) {
    this.salt = this.constructor.generateSalt();
    this.password = this.constructor.encryptPassword(this.password, this.salt);
  }
  next();
});
schema.statics.generateSalt = generateSalt;
schema.statics.encryptPassword = encryptPassword;

schema.method('correctPassword', function(candidatePassword) {
  return encryptPassword(candidatePassword, this.salt) === this.password;
  console.log("rascal password test");
});
*/
mongoose.model("thirdpartyuser", schema);