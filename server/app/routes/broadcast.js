'use strict';
var router = require('express').Router();
module.exports = router;
var Promise = require('bluebird');
var AWS = require('aws-sdk');
var Youtube = require("youtube-api");
var Twitter = require('twitter');
var FB = require('fb');
var promisifiedFB = Promise.promisify(FB.napi, {
	context: FB
});
var mongoose = require('mongoose');
var Post = mongoose.model('Posts');
var User = mongoose.model('User');
var request = require("request");
var HTTPS = require('https');
var bucketName = "releaserposts";
var env = require('./../../env');
var twitterConfig = env.TWITTER;
var soundCloudConfig = env.SOUNDCLOUD;
var googleConfig = env.GOOGLE;
var facebookConfig = env.FACEBOOK;

router.use(function(req, res, next) {
	User.findOne()
		.then(function(user) {
			if (!user) throw new Error('not found!');
			req.user = user;
			next();
		})
		.then(null, next);
})

//============ FIND A SINGLE POST ===========
router.param('postId', function(req, res, next, postId) {
	Post.findById(postId)
		.then(function(post) {
			if (!post) throw new Error('not found!');
			req.post = post;
			next();
		})
		.then(null, next);
});

//============== TWITTER ==============
router.post('/:postId/twitter', function(req, res, next) {
	if (req.body.twitterPost && req.body.twitterPost != undefined && req.body.twitterPost != "") {
		var client = new Twitter({
			consumer_key: twitterConfig.consumerKey,
			consumer_secret: twitterConfig.consumerSecret,
			access_token_key: req.body.token,
			access_token_secret: req.body.tokenSecret
		});

		client.post('statuses/update', {
			status: req.body.twitterPost
		}, function(error, tweet, response) {
			res.json({
				success: true
			});
		});
	} else {
		res.json({
			success: false
		});
	}
});

//============== YOUTUBE ==============
router.post('/:postId/youtube', function(req, res, next) {
	if (req.body.awsVideoKeyName != "" && req.body.youTubeTitle != "" && req.body.youTubeDescription != "") {
		AWS.config.update({
			accessKeyId: env.AWS.accessKeyId,
			secretAccessKey: env.AWS.secretAccessKey,
		});

		var s3 = new AWS.S3();
		var s3data = {
			Bucket: bucketName,
			Key: req.body.awsVideoKeyName
		};

		var oauth = Youtube.authenticate({
			type: "oauth",
			client_id: googleConfig.clientID,
			client_secret: googleConfig.clientSecret,
			redirect_url: googleConfig.callbackURL
		});

		oauth.setCredentials({
			access_token: req.body.token
		});
		s3.getObject(s3data, function(err, data) {
			var params = {
				resource: {
					snippet: {
						title: req.post.youTubeTitle,
						description: req.post.youTubeDescription
					},
					status: {
						privacyStatus: "private"
					}
				},
				part: 'snippet,status',
				media: {
					body: data.Body
				}
			};

			Youtube.videos.insert(params, function(err, resdata) {
				res.json({
					success: true
				});
			});
		});
	} else {
		res.json({
			success: false
		});
	}
});

//============== YOUTUBE ==============
router.post('/:postId/soundcloud', function(req, res, next) {
	if (req.body.awsAudioKeyName != "") {
		AWS.config.update({
			clientID: soundCloudConfig.clientID,
			clientSecret: soundCloudConfig.clientSecret
		});
		var s3 = new AWS.S3();
		var s3data = {
			Bucket: bucketName,
			Key: req.body.awsAudioKeyName
		};
		s3.getObject(s3data, function(err, data) {
			res.json(data)
		});
	} else {
		res.json(null)
	}
});

//============== FACEBOOK USER ==============
router.post('/:postId/facebookuser', function(req, res, next) {
	if (req.body.facebookPost && req.body.facebookPost != undefined && req.body.facebookPost != "") {
		FB.setAccessToken(req.body.token);
		promisifiedFB('me/feed',
				'post', {
					message: req.body.facebookPost
				}
			)
			.then(function(FBres) {
				res.json({
					success: true
				});
			})
			.then(function(err) {
				res.json({
					success: false
				});
			})
	} else {
		res.json({
			success: false
		});
	}
});

//============== FACEBOOK PAGE ==============
//*** PENDING: POST TO FACEBOOK PAGE REQUIRES REVIEW FROM FACEBOOK
router.post('/:postId/facebookpage', function(req, res, next) {
	if (req.body.facebookPageUrl && req.body.facebookPageUrl != "") {
		var identifier = req.body.facebookPageUrl.substring(req.body.facebookPageUrl.lastIndexOf("/"));
		HTTPS.get('https://graph.facebook.com/me/accounts?access_token=' + req.body.token + '&fields=link,access_token', function(result) {
			var body = "";
			result.on('data', function(resData) {
				body += resData;
			});
			result.on('end', function() {
				var data = JSON.parse(body);
				var accessToken = "";
				var pageID = "";
				for (var i = 0; i < data.data.length; i++) {
					if (data.data[i].link.split('/')[3] == identifier.split('/')[1]) {
						accessToken = data.data[i].access_token,
							pageID = data.data[i].id
					}
				}

				FB.setAccessToken(accessToken);
				promisifiedFB(pageID + '/feed',
						'post', {
							message: req.body.facebookPost,
							'publish_actions': 'true',
							'published': 'true'
						}
					)
					.then(function(FBres) {
						res.json({
							success: true
						});
					})
					.catch(function(err) {
						res.json({
							success: true
						});
					})
			});
		});
	} else {
		res.json({
			success: true
		});
	}
});