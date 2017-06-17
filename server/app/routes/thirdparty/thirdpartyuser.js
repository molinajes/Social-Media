'use strict';
var scConfig = global.env.SOUNDCLOUD;
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Submission = mongoose.model('Submission');
var Channel = mongoose.model('Channel');
var User = mongoose.model('User');
var RepostEvent = mongoose.model('RepostEvent');
var Email = mongoose.model('Email');
var rootURL = require('../../../env').ROOTURL;
var PremiereSubmission = mongoose.model('PremierSubmission');
var Promise = require('promise');
var scConfig = global.env.SOUNDCLOUD;
var sendEmail = require("../../mandrill/sendEmail.js"); //takes: to_name, to_email, from_name, from_email, subject, message_html
var paypalCalls = require("../../payPal/paypalCalls.js");
var scheduleRepost = require("../../scheduleRepost/scheduleRepost.js");
var scWrapper = require("../../SCWrapper/SCWrapper.js");
scWrapper.init({
  id: scConfig.clientID,
  secret: scConfig.clientSecret,
  uri: scConfig.redirectURL
});
var thirdpartyuser = mongoose.model('thirdpartyuser');
var submission = mongoose.model('Submission');
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

//all sub admin account get
router.get('/', function(req, res){
	thirdpartyuser.find(function(err, docs){		
		res.json(docs);
	});	
});

//gernerate salt
var generateSalt = function() {
  return crypto.randomBytes(16).toString('base64');
};


//sub admin create part
router.post('/', function(req, res, next) {
  console.log(req.body.accountemail + " accountemail");
  var soundcloud;
  User.findOne({ email: req.body.accountemail})
  .then(function(docs){
    console.log(" find success");
    soundcloud = docs.soundcloud;    
    console.log(docs.soundcloud + "account soundcloud");
  });
  var newuser = new thirdpartyuser;
  newuser.email = req.body.email;
  newuser.password = req.body.password;

  newuser.accountemail = req.body.accountemail;
  var paidaccount = {
    userID: "",
    premierUrl: "",
    submissionUrl: "",
    description: "",
    price : "",
    createdOn : "",
    groups : "default",
    linkInBio : ""
  };
  //newuser.paidRepost = paidaccount;
  newuser.name="rascal";
  newuser.soundcloud = soundcloud;
  newuser.save().then(function(docs){
    console.log(docs + "rascal creact admin success");
  });
})


//sub admin add part   mongo findone method
router.get('/adduser/:id', function(req, res){
	var id= req.params.id;
	console.log(id);
	thirdpartyuser.findOne({ email: id})
	.then(function(docs){
		console.log(docs + "rascal docs");
		res.json(docs);
	});
});

router.delete('/:id', function(req, res){
	var id = req.params.id;
	console.log(id);
	thirdpartyuser.remove({ email: id})
	.then( function(docs){
		console.log("rascal delete");
		res.json(docs);
	})
});

//sub admin login part
router.post('/login', function(req, res, next) {
   passport.authenticate('local-sublogin', function(err, user, info) {
    if (err) {    	
      return res.json({
        success: false,
        "message": err
      });
    }
    if (!user) {
      return res.json({
        success: false,
        "message": "Invalid Username or Password"
      });
    } else {    	
      req.login(user, function(err) {
        //if(req.body.rememberme && (req.body.rememberme == "1" || req.body.rememberme == 1)){
        //req.session.cookie.expires = false;
        req.session.name = user.userid;
        req.session.cookie.expires = new Date(Date.now() + (6 * 3600000));
        req.session.cookie.maxAge = 6 * 3600000;
        //req.session.cookie.expires = false;
        delete user.password;
        delete user.salt;
        return res.json({
          'success': true,
          'message': '',
          'user': user
        });
      });
    }
  })(req, res);
   //
})

//get paidrepostaccount
router.get('/getPaidRepostAccounts', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var accPromArray = [];
  var results = [];
  req.user.paidRepost.forEach(function(pr) {
  var pr = pr.toJSON();
    accPromArray.push(User.findOne({
        _id: pr.userID
      }).then(function(u) {
        if (u) {
          pr.user = u.soundcloud;
          return new Promise(function(resolve, reject) {
            scWrapper.setToken(pr.user.token);
            var reqObj = {
              method: 'GET',
              path: '/me',
              qs: {}
            };
            scWrapper.request(reqObj, function(err, data) {
              if (pr.linkInBio == undefined && data) pr.linkInBio = JSON.stringify(data).includes('artistsunlimited');
              resolve(pr);
            })
          })
        }
      })
      .then(function(newPr) {
        if (newPr) {
          results.push(pr);
        }
      }))
  });
  Promise.all(accPromArray)
    .then(function(arr) {
      res.send(results);
    }).then(null, next);
});

//add subadminaccount 
/*
router.post('/addaccount', function(req, res, next) {
  var regaccount = req.body.registeraccount;
  console.log(req.body.userID + " thirdpartyaccount add registeraccount");
  var paidaccount = {
    userID: req.body.userID,
    premierUrl: req.body.premierUrl,
    submissionUrl: req.body.submissionUrl,
    description: req.body.description,
    price : req.body.price,
    createdOn : req.body.createdOn,
    groups : [],
    linkInBio : req.body.linkInBio
  };
  thirdpartyuser.findOneAndUpdate({
      email: req.body.useremail
    }, {
      $addToSet: {
        paidRepost : paidaccount
      }
    },{
      new: true
    })
    .then(function(data) {
    });   
});*/

//save subadminaccount with scheduler and subadminaccount part
router.post('/saveaccount', function(req, res, next) {
  var regaccount = req.body.registeraccount;
  var schduleraccount = {};
  var subadminaccount = {};
  var paidaccount = {};
  schduleraccount = req.body.scheduleraccount;
  //subadminaccount = req.body.subadminaccount;
  //paid account add part
  for (var i = 0; i < schduleraccount.length; i++) {
    console.log(schduleraccount[i].userID + " schduleraccount[i].userID");
    paidaccount = {
    userID: schduleraccount[i].userID,
    premierUrl: schduleraccount[i].premierUrl,
    submissionUrl: schduleraccount[i].submissionUrl,
    description: schduleraccount[i].description,
    price : schduleraccount[i].price,
    createdOn : schduleraccount[i].createdOn,
    groups : [],
    linkInBio : schduleraccount[i].linkInBio
    };
    thirdpartyuser.findOneAndUpdate({
      email: req.body.useremail
    }, {
      $addToSet: {
        paidRepost : paidaccount
      }
    },{
      new: true
    })
    .then(function(data) {
    }); 
  };
  //submissionaccount add part
  for ( i = 0; i < req.body.submissionaccount.length; i++) {
    console.log(req.body.submissionaccount[i].name + " req.body.submissionaccount[i].name");
    subadminaccount = {
      name: req.body.submissionaccount[0][i],
      email: req.body.submissionaccount[1][i]
    };
    thirdpartyuser.findOneAndUpdate({
      email: req.body.useremail
    }, {
      $addToSet: {
        submissionaccount : subadminaccount
      }
    },{
      new: true
    })
    .then(function(data) {
    }); 
  };
});

//get submission email 
router.get('/getsubmissionAccounts', function(req, res, next){
  submission.find(function(err, docs){
    res.json(docs);
  });

  /*
  var submissionuser = {};
  var submissionname = {};
  var submissionemail = {};
  submission.find(function(err, json){
    var submissionus = JSON.parse(docs);
    for (var i = 0; i < submissionus.length; i++) {
      submissionname[i] = submissionus[i].username;
      submissionemail[i] = submissionus[i].useremail;
      console.log(submissionemail[i] + " submissionemail");
    };
    submissionuser[0] = submissionname;
    submissionuser[1] = submissionemail;
    console.log(submissionuser[0] + "submission email");
    res.json(submissionuser);
  });*/
});

/*module.exports = function(app) {

  // When passport.authenticate('local') is used, this function will receive
  // the email and password to run the actual authentication logic.
  var strategyFn = function(email, password, done) {
    thirdpartyuser.findOne({
        email: email        
      })
      .then(function(user) {
        // user.correctPassword is a method from the User schema.
        // if (!user || !user.correctPassword(password)) {
        if (!user || !user.correctPassword(password)) {
          done(null, false);
        } else {
          // Properly authenticated.
          done(null, user);
        }
      }, function(err) {
        done(err);
      });
  };

  passport.use('local-sublogin', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, strategyFn));


};*/

  //password encrypt part
  /*var encryptPassword = function(plainText, salt) {
    var hash = crypto.createHash('sha1');
    hash.update(plainText);
    hash.update(salt);
    return hash.digest('hex');
  };

  var correctPassword = function(password, salt, dbpassword) {
    var encryptedpass = encryptPassword(password, salt);
    return encryptPassword(password, salt) === dbpassword;
  }*/


//login email compare part start
/*module.exports.getUserByUsername = function(email, callback){
	var query = {email: email};
	thirdpartyuser.findOne(query, callback);
}

module.exports.getUserById = function(id, callback){
	User.findById(id, callback);
}

module.exports.comparePassword = function(candidatePassword,hash callback){
	if (candidatePassword == hash) {
		console.log("password ok");
	};
}
//login email compare part end


passport.use(new LocalStrategy(
  function(email, password, done) {
   thirdpartyuser.getUserByUsername(email, function(err, user){
   	if (err) throw err;
   	if (!user) {
   		return done(null, false, {message: 'Unkwon User'});
   	}
   	thirdpartyuser.comparePassword(password, user.password, function(err, isMatch){
   		if(err) throw err;
   		if(isMatch){
   			return done(null, user);
   		}else {
   			return done(null, false, {message: 'invalid password'});
   		}
   	});
   }); 
 }));

router.post('/login', passport.authenticate('local', {successRedirect:'/', failureRedirect:'/users/login', failureFlash: true}),
	function(req, res){
		  console.log("rascal thirdpartyuser login");

		res.redirect('/');		
});*/
