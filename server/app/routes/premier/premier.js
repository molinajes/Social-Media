'use strict';
var router = require('express').Router();
module.exports = router;
var Busboy = require('busboy');
var AWS = require('aws-sdk');
var sendEmail = require("../../mandrill/sendEmail.js");
var Promise = require('bluebird');
var AWS = require('aws-sdk');
var mongoose = require('mongoose');
var PremierSubmission = mongoose.model('PremierSubmission');
var awsConfig = require('./../../../env').AWS;
var rootURL = require('../../../env').ROOTURL;
var User = mongoose.model('User')

router.get('/unaccepted', function(req, res, next) {
  var genre = req.query.genre ? req.query.genre : undefined;
  var skipcount = parseInt(req.query.skip);
  var limitcount = parseInt(req.query.limit);
  var paidRepostIds = [];
  if (req.query.userID != "all") {
    paidRepostIds.push(req.query.userID);
  } else if (req.user.paidRepost.length > 0) {
    req.user.paidRepost.forEach(function(acc) {
      paidRepostIds.push(acc.userID);
    })
  }
  var searchObj = {
    userID: {
      $in: paidRepostIds
    },
    status: req.query.status
  };
  if (genre != undefined && genre != 'null') {
    searchObj = {
      genre: genre
    };
  }
  PremierSubmission
    .find(searchObj)
    .populate('userID')
    .skip(skipcount)
    .limit(limitcount)
    .sort({
      submissionDate: 1
    })
    .then(function(subs) {
      res.send(subs);
    })
    .then(null, next);
});

router.post('/', function(req, res, next) {
  parseMultiPart()
    .then(uploadToBucket)
    .then(saveToDB)
    .then(mailData)
    .catch(errorHandler);

  var body = {
    fields: {},
    file: {}
  };

  function parseMultiPart() {
    return new Promise(function(resolve, reject) {
      var busboy = new Busboy({
        headers: req.headers,
        limits: {
          fileSize: 100 * 1024 * 1024,
          files: 1
        }
      });
      busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {

        var buffer = new Buffer('');
        var type = mimetype.split('/')[1];
        var newfilename = (filename.substr(0, filename.lastIndexOf('.')) || filename) + '_' + Date.now().toString() + '.' + type;

        file.on('data', function(data) {
          buffer = Buffer.concat([buffer, data]);
        });

        file.on('limit', function() {
          reject('Error: File size cannot be more than 20 MB');
        });

        file.on('end', function() {
          body.file = {
            fieldname: fieldname,
            buffer: buffer,
            filename: filename,
            newfilename: newfilename,
            encoding: encoding,
            mimetype: mimetype
          };
        });
      });
      busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
        body.fields[fieldname] = val;
      });
      busboy.on('finish', function() {
        console.log('finished')
        resolve();
      });

      busboy.on('error', function(err) {
        reject(err);
      });
      req.pipe(busboy);
    });
  }

  function uploadToBucket() {
    return new Promise(function(resolve, reject) {
      console.log(body.file);
      if (!body.file.buffer) {
        resolve({
          Location: undefined
        })
      }
      AWS.config.update({
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      });

      var data = {
        Key: body.file.newfilename,
        Body: body.file.buffer,
        ContentType: body.file.mimetype
      };
      var s3 = new AWS.S3({
        params: {
          Bucket: awsConfig.bucketName
        }
      });
      s3.upload(data, function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  function saveToDB(data) {
    console.log(data);
    console.log(body);
    var newPremierSubmission = new PremierSubmission({
      userID: body.fields.userID,
      s3URL: data.Location,
      genre: body.fields.genre,
      email: body.fields.email,
      name: body.fields.name,
      comment: body.fields.comment,
      trackLink: body.fields.trackLink
    });
    return newPremierSubmission.save();
  }

  function mailData() {
    return res.end();
  }

  function errorHandler(err) {
    return res.status(400).send(err);
  }
});

router.get('/count', function(req, res, next) {
  function getCount(user) {
    var paidRepostIds = [];
    if (user.paidRepost.length > 0) {
      user.paidRepost.forEach(function(acc) {
        paidRepostIds.push(acc.userID);
      })
    }
    var searchObj = {
      userID: {
        $in: paidRepostIds
      },
      status: 'new'
    };
    PremierSubmission.count(searchObj, function(err, count) {
      if (err) next(err);
      else {
        res.send({
          count: count
        });
      }
    })
  }
  if (req.user.role != 'admin') {
    User.findOne({
        'paidRepost.userID': req.user._id
      })
      .then(function(adminUser) {
        if (adminUser) getCount(adminUser);
        else(next(new Error('user not found')));
      }).then(null, next)
  } else {
    getCount(req.user);
  }
})

router.put('/accept', function(req, res, next) {
  PremierSubmission.findByIdAndUpdate(req.body.submi._id, req.body.submi, {
      new: true
    })
    .then(function(sub) {
      res.send(sub);
    })
    .then(null, next);
});

router.post('/delete', function(req, res, next) {
  PremierSubmission
    .remove({
      _id: req.body.id
    })
    .then(function() {
      return res.end();
    })
    .then(null, next);
});
