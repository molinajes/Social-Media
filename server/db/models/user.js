'use strict';
var crypto = require('crypto');
var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  role: {
    type: String,
    default: 'user'
  },
  name: {
    type: String
  },
  email: {
    type: String
  },
  password: {
    type: String
  },
  salt: {
    type: String
  },
  permanentLinks: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
  },
  twitter: {
    id: String,
    username: String,
    token: String,
    tokenSecret: String
  },
  facebook: {
    id: String,
    name: String,
    token: String,
    refreshToken: String
  },
  google: {
    id: String,
    name: String,
    token: String,
    refreshToken: String
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
  queue: {
    type: [Number],
    default: []
  },
  description: {
    type: String,
    default: ""
  },
  thirdPartyInfo: {
    username: String,
    password: String,
    passwordPlain: String,
    salt: String
  },
  linkedAccounts: {
    type: Array,
    default: []
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
  submissionsCustomEmailButtons: {
    type: Array,
    default: []
  },
  premierCustomEmailButtons: {
    type: Array,
    default: []
  },
  repostCustomizeEmails: {
    type: Array,
    default: []
  },
  premierCustomizeEmails: {
    type: Array,
    default: []
  },
  profilePicture: {
    type: String
  },
  blockRelease: {
    type: Date,
    default: new Date(0)
  },
  paypal_email: String,
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
  astzOffset: {
    type: Number,
    default: -300
  },
  repostSettings: {
    trade: {
      comments: {
        type: Array,
        default: []
      },
      comment: {
        type: Boolean,
        default: false
      },
      like: {
        type: Boolean,
        default: false
      }
    },
    schedule: {
      comments: {
        type: Array,
        default: []
      },
      comment: {
        type: Boolean,
        default: false
      },
      like: {
        type: Boolean,
        default: false
      }
    },
    paid: {
      comments: {
        type: Array,
        default: []
      },
      comment: {
        type: Boolean,
        default: false
      },
      like: {
        type: Boolean,
        default: false
      }
    },
    poolOn: {
      type: Boolean,
      default: true
    }
  },
  notificationSettings: {
    facebookMessenger: {
      messengerID: Number,
      lastMessageDate: {
        type: Date,
        default: new Date(0)
      },
      tradeRequest: {
        type: Boolean,
        default: true
      },
      tradeAcceptance: {
        type: Boolean,
        default: true
      },
      trackRepost: {
        type: Boolean,
        default: false
      },
      trackUnrepost: {
        type: Boolean,
        default: false
      },
      failedRepost: {
        type: Boolean,
        default: true
      },
      accessToken: {
        type: Boolean,
        default: true
      }
    },
    email: {
      tradeRequest: {
        type: Boolean,
        default: true
      },
      tradeAcceptance: {
        type: Boolean,
        default: true
      },
      trackRepost: {
        type: Boolean,
        default: false
      },
      trackUnrepost: {
        type: Boolean,
        default: false
      },
      failedRepost: {
        type: Boolean,
        default: true
      },
      accessToken: {
        type: Boolean,
        default: true
      }
    }
  },
  admin: {
    type: Boolean,
    default: false
  },
  cut: {
    type: Number,
    default: 0.7
  },
  templates: {
    type: Array,
    default: []
  },
  ips: {
    type: Array,
    default: []
  }
});

// method to remove sensitive information from user objects before sending them out
schema.methods.sanitize = function() {
  return _.omit(this.toJSON(), ['password', 'salt']);
};

// generateSalt, encryptPassword and the pre 'save' and 'correctPassword' operations
// are all used for local authentication security.
var generateSalt = function() {
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
});

mongoose.model('User', schema);
