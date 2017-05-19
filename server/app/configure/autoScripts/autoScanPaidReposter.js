'use strict';
var https = require('https');
var router = require('express').Router();
var url = require('url');
var mongoose = require('mongoose');
var Follower = mongoose.model('Follower');
var TrackedUser = mongoose.model('TrackedUser');
var DownloadTrack = mongoose.model('DownloadTrack');
var PaidRepostAccount = mongoose.model('PaidRepostAccount');
var csv = require('csv-write-stream');
var fs = require('fs');
var scConfig = require('./../../../env').SOUNDCLOUD;
var scWrapper = require("../../SCWrapper/SCWrapper.js");

scWrapper.init({
  id: scConfig.clientID,
  secret: scConfig.clientSecret,
  uri: scConfig.redirectURL
});

module.exports = getPaidRepostAccounts;

function getPaidRepostAccounts() {
  PaidRepostAccount
    .find({}, function(err, paidReposters) {
      if (!err) {
        paidReposters.forEach(function(elm) {
          getActivities(elm);
        });
      }
    });
}

function getActivities(paidReposter) {
  // Need oauth token for getting activities of the user
  var getPath = 'https://api-v2.soundcloud.com/profile/soundcloud:users:' + paidReposter.scID + '?limit=20&offset=0?client_id=' + scConfig.clientID;
  var req = https.get(getPath, function(res) {
    var activities = '';
    var activitiesData = {};
    res.on('data', function(activitiesChunk) {
      activities += activitiesChunk;
    });
    res.on('end', function() {
      try {
        activitiesData = JSON.parse(activities);
      } catch (err) {
        console.log(err);
      }
      scanCollection(activitiesData.collection);
    });
  });
  req.on('error', function(err) {
    console.log(err);
  });
}

function scanCollection(collection) {
  collection.forEach(function(elm) {
    if (elm.type === 'track-repost') {
      getUser(activity);
    }
  });
}

function getUser(activity) {
  var userId = activity.track.user_id;
  var reqObj = {
    method: 'GET',
    path: '/users/' + userId,
    qs: {}
  };
  scWrapper.request(reqObj, function(err, res) {
    if (!err) {
      var userData = {};
      try {
        userData = JSON.parse(res);
      } catch (err) {
        console.log(err);
      }
      addFollower(userData);
    }
  });
}

function addFollower(user) {
  var emailArray = null;
  if (user.description) {
    var emailArray = user.description.match(/[a-z\._\-!#$%&'+/=?^_`{}|~]+@[a-z0-9\-]+\.\S{2,3}/igm);
  }
  if (emailArray) {
    var email = myArray[0];
    var reqfollow = {
      method: 'GET',
      path: '/users/' + user.id + '/web-profiles',
      qs: {}
    };
    scWrapper.request(reqfollow, function(err, webProfiles) {
      user.websites = '';
      if (!err) {
        if (webProfiles) {
          for (var index in webProfiles) {
            switch (webProfiles[index].service) {
              case 'twitter':
                user.twitterURL = webProfiles[index].url;
                break;
              case 'instagram':
                user.instagramURL = webProfiles[index].url;
                break;
              case 'facebook':
                user.facebookURL = webProfiles[index].url;
                break;
              case 'youtube':
                user.youtubeURL = webProfiles[index].url;
                break;
              case 'personal':
                user.websites += webProfiles[index].url + '\n';
                break;
            }
          }
        }
      }
      Follower.findOne({
          "scID": user.id
        })
        .then(function(follower) {
          if (!follower) {
            var newFollower = new Follower({
              artist: user.track_count > 0,
              scID: user.id,
              scURL: user.permalink_url,
              name: user.full_name,
              username: user.username,
              followers: user.followers_count,
              email: email,
              description: user.description,
              numTracks: user.track_count,
              facebookURL: user.facebookURL,
              instagramURL: user.facebookURL,
              twitterURL: user.twitterURL,
              youtubeURL: user.youtubeURL,
              emailDayNum: Math.floor(Math.random() * 14) + 1,
              websites: user.websites,
              genre: user.genre,
              allEmails: emailArray
            });
            newFollower.save();
          }
        });
    });
  }
}