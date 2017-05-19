'use strict';
var router = require('express').Router();
module.exports = router;
var Promise = require('bluebird');
var Busboy = require('busboy');
var AWS = require('aws-sdk');
var awsConfig = require('./../../env').AWS;
var mongoose = require('mongoose');
var Post = mongoose.model('Posts');

//============= UPLOAD FILE TO AWS =============
router.post('/', function(req, res, next) {
	var s3 = new AWS.S3();
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
				resolve();
			});

			busboy.on('error', function(err) {
				reject(err);
			});
			req.pipe(busboy);
		});
	}

	parseMultiPart()
		.then(function() {
			if (body.file && body.file.newfilename) {
				AWS.config.update({
					accessKeyId: awsConfig.accessKeyId,
					secretAccessKey: awsConfig.secretAccessKey,
				});

				var uploadData = {
					Key: body.file.newfilename,
					Body: body.file.buffer,
					ContentType: body.file.mimetype
				};
				var s3 = new AWS.S3({
					params: {
						Bucket: "releaserposts"
					}
				});
				s3.upload(uploadData, function(err, data) {
					if (err) {
						res.json(err);
					} else {
						res.json(data);
					}
				});
			} else {
				res.json({
					key: "",
					Location: ""
				});
			}
		});
});

//======== DELETE A SINGLE FILE FROM AWS =======
router.delete('/:keyName', function(req, res, next) {
	var s3 = new AWS.S3();
	var params = {
		Bucket: "releaserposts",
		Key: req.params.keyName
	};

	s3.deleteObject(params, function(err, data) {
		if (err) {
			console.log(err);
			res.end();
		} else {
			console.log('data from single SINGLE delete', data);
			res.status(204).end();
		}
	});
});

//========= DELETE BOTH FILES FROM AWS =========
router.delete('/:postId/both', function(req, res, next) {
	Post.findOne({
			'_id': req.params.postId
		})
		.then(function(post) {
			console.log('post from inside delete both files', post);
			var s3 = new AWS.S3();
			var params = {
				Bucket: "releaserposts",
				Delete: {
					Objects: [{
						Key: post.awsAudioKeyName
					}, {
						Key: post.awsVideoKeyName
					}]
				}
			};

			s3.deleteObjects(params, function(err, data) {
				if (err) {
					console.log(err);
					res.end();
				} else {
					console.log('data from deleting BOTH files', data);
					res.status(204).end();
				}
			});
		});
});