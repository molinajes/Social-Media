'use strict';
var router = require('express').Router();
module.exports = router;
var AWS = require('aws-sdk');
var mongoose = require('mongoose');
var Post = mongoose.model('Posts');
var User = mongoose.model('User');
var bucketName = 'chris-tryens-test-bucket';
var HTTPS = require('https');

//============== GET ALL POSTS ==============
router.get('/', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  var userid = req.user._id;
  Post.find({
      userID: userid
    }).sort({
      postDate: 1
    })
    .then(function(posts) {
      res.json(posts);
    })
    .then(null, next);
});

//============== CREATE A POST ==============
router.post('/', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  Post.create(req.body)
    .then(function(post) {
      res.status(201).json(post);
    })
    .then(null, next);
});

//============ FIND A SINGLE POST ===========
router.param('postId', function(req, res, next, postId) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  Post.findById(postId)
    .then(function(post) {
      if (!post) throw new Error('not found!');
      req.post = post;
      next();
    })
    .then(null, next);
});

//============== UPDATE A POST ==============
router.put('/:postId', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  req.post.set(req.body.editedPost);
  req.post.save()
    .then(function(post) {
      res.json(post);
    })
    .then(null, next);
});

//============== UPDATE RELEASE STATUS ==============
router.put('/:postId/status', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  Post.update({
      _id: req.params.postId
    }, {
      released: true
    })
    .then(function(posts) {
      res.json(posts);
    })
    .then(null, next);
});

//============== GET POSTS TO DISPLAY AT EDIT==============
router.get('/:postId', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  Post.findOne({
      _id: req.params.postId
    })
    .then(function(posts) {
      res.json(posts);
    })
    .then(null, next);
});

//============== DELETE A POST ==============
router.delete('/:postId', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  req.post.remove()
    .then(function() {
      res.status(204).end();
    })
    .then(null, next);
});

router.get('/checkTokenValidity/:userID/:platform', function(req, res, next) {
  if (!req.user) {
    next(new Error('Unauthorized'));
    return;
  }
  if (req.params.platform == 'facebook') {
    User.findOne({
        _id: req.params.userID
      })
      .then(function(user) {
        if (user) {
          var options = {
            host: 'graph.facebook.com',
            path: '/me?access_token=' + user.facebook.token + '&fields=id'
          };

          HTTPS.get(options, function(resp) {
            var data = '';
            resp.on('data', function(chunk) {
              data += chunk;
            });
            resp.on('end', function() {
              var d = JSON.parse(data);
              if (d.id == undefined) {
                console.log('data.id', data.id);
                User.findByIdAndUpdate(req.params.userID, {
                  'facebook.token': ''
                }, {
                  new: true
                })

                .then(function(nuser) {
                    res.json(nuser);
                  })
                  .then(null, next);
              } else {
                res.json(null);
              }
            });
          });
        }
      });
  } else if (req.params.platform == 'google') {
    User.findOne({
        _id: req.params.userID
      })
      .then(function(user) {
        if (user) {
          var options = {
            host: 'www.googleapis.com',
            path: '/oauth2/v1/tokeninfo?access_token=' + user.google.token
          };

          HTTPS.get(options, function(resp) {
            var data = '';
            resp.on('data', function(chunk) {
              data += chunk;
            });
            resp.on('end', function() {
              var d = JSON.parse(data);
              if (d.user_id == undefined) {
                User.findByIdAndUpdate(req.params.userID, {
                  'google.token': ''
                }, {
                  new: true
                })

                .then(function(nuser) {
                    res.json(nuser);
                  })
                  .then(null, next);
              } else {
                res.json(null);
              }
            });
          });
        }
      });
  }
});