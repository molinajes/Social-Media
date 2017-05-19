var Promise = require('promise');
var SCResolve = require('soundcloud-resolve-jsonp/node');
var SC = require('node-soundcloud');
SC.init({
    id: '8002f0f8326d869668523d8e45a53b90',
    secret: '7c896a35685064e133b6a01998f62714',
    uri: "https://localhost:1443/callback.html"
});


var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/newEmails');

var db = mongoose.connection;

db.on('error', function(err) {
    console.log('connection error', err);
});

db.once('open', function() {
    console.log('connected.');
});

var Schema = mongoose.Schema;
var SCEmailsSchema = new Schema({
    email: {
        type: String,
        unique: true
    },
    numTracks: Number,
    artist: Boolean,
    soundcloudID: Number,
    soundcloudURL: String,
    username: String,
    followers: Number,
    randomDay: Number,
    scanned: Boolean
});
var SCEmails = mongoose.model('SCEmails', SCEmailsSchema);

var SCUsersSchema = new Schema({
    numTracks: Number,
    soundcloudID: {
        type: Number,
        unique: true
    },
    soundcloudURL: String,
    username: String,
    followers: Number
});
var SCUsers = mongoose.model('AllOfSouncloud', SCUsersSchema);

var pr = (new Promise(function(fulfill, reject) {
    SCResolve({
        url: process.argv[2],
        client_id: "8002f0f8326d869668523d8e45a53b90"
    }, function(err, track) {
        if (err) {
            reject(err);
        } else {
            fulfill(track);
        }
    });
}))

pr.then(function(user) {
        console.log("\nScanning " + user.username + " with " + user.followers_count + " followers.");
        getFollowers('/users/' + user.id + '/followers');
    })
    .then(null, console.log);
var totalGain = 0;
var totalEmails = 0;
logProgress();

function logProgress() {
    setTimeout(function() {
        console.log('scanned ' + totalGain + ' followers');
        console.log('got ' + totalEmails + ' emails');
        logProgress();
    }, 10000);
}

function getFollowers(nextURL) {
    SC.get(nextURL, {
        limit: 200
    }, function(err, res) {
        totalGain += 200
        if (err) {
            console.log(err);
            scanNextBiggestUser();
        }
        if (res && res.collection && res.collection.length) {
            res.collection.forEach(function(follower) {
                if (follower.description) {
                    var myArray = follower.description.match(/[a-z\._\-!#$%&'+/=?^_`{}|~]+@[a-z0-9\-]+\.\S{2,3}/igm);
                } else {
                    var myArray = null;
                }

                if (myArray) {
                    var email = myArray[0];
                    SCEmails.findOneAndUpdate({
                        email: email
                    }, {
                        email: email,
                        numTracks: follower.track_count,
                        artist: (follower.track_count > 0),
                        soundcloudID: follower.id,
                        soundcloudURL: follower.permalink_url,
                        username: follower.username,
                        followers: follower.followers_count,
                        randomDay: Math.floor(Math.random() * 50) + 1,
                        scanned: false
                    }, {
                        upsert: true
                    }).then(function(user) {
                        totalEmails++;
                    }).then(null, console.log);
                }
                if (follower.followers_count > 1000) {
                    SCUsers.findOneAndUpdate({
                        soundcloudID: follower.id
                    }, {
                        numTracks: follower.track_count,
                        soundcloudID: follower.id,
                        soundcloudURL: follower.permalink_url,
                        username: follower.username,
                        followers: follower.followers_count,
                    }, {
                        upsert: true
                    }).then(null, console.log);
                }
            });
        }
        if (res && res.next_href) {
            getFollowers(res.next_href);
        } else {
            scanNextBiggestUser();
        }
    });
}


function scanNextBiggestUser() {
    SCEmails.findOne({
            scanned: false
        }, null, {
            sort: {
                followers: -1
            }
        })
        .then(function(emailFlwr) {
            if (!emailFlwr) throw Error('nobody found to scan');
            emailFlwr.scanned = true;
            emailFlwr.save();
            console.log("\nScanning " + emailFlwr.username + " with " + emailFlwr.followers + " followers.");
            getFollowers('/users/' + emailFlwr.soundcloudID + '/followers');
        })
        .then(null, console.log);
}

var randStringGenerator