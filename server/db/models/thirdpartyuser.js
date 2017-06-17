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
  accountemail: {
    type: String
  },  
  submissionaccount: [{
    name: {
      type: String
    },
    email: {
      type: String
    }
  }],
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
  availableSlots: {
    type: Object,
    default: {
      'sunday': [1, 4, 8, 11, 14, 17, 20],
      'monday': [1, 4, 8, 11, 14, 17, 20],
      'tuesday': [1, 4, 8, 11, 14, 17, 20],
      'wednesday': [1, 4, 8, 11, 14, 17, 20],
      'thursday': [1, 4, 8, 11, 14, 17, 20],
      'friday': [1, 4, 8, 11, 14, 17, 20],
      'saturday': [1, 4, 8, 11, 14, 17, 20]
    }
  },
  paypal_email: String,
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
  }],
  cut: {
    type: Number,
    default: 0.7
  },
  templates: {
    type: Array,
    default: []
  },
  soundcloud: {
    id: Number,
    username: String,
    permalinkURL: String,
    avatarURL: String,
    token: String,
    followers: Number,
    pseudoname: String
  },
  ips: {
    type: Array,
    default: []
  }
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