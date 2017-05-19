var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var router = require('express').Router();
var request = require('request');
var mongoose = require('mongoose');
var graph = require('fbgraph');
module.exports = router;
//var Analytics = mongoose.model('Analytics');
var Twitter = require('twitter');
//var twitter_database = mongoose.model("Twitter");
//var youtube_database = mongoose.model("Youtube");
var path = require('path');
var config = require(path.join(__dirname, '../../../env'));
var socialconf = require('../config');
/*Facebook analytics
req.body->{
token : access token of facebook (optional, if not send, only data from database served)
pageid : page to add to watch list (optional, required first time when user adds a page)
userid : artistUnlimited userid
uid : facebook userid
}
*/

router.get("/facebook/generate", function(req, res, done) {
    var AuthTokens = mongoose.model("AuthTokens"),
        AnalyticsSchema = mongoose.model("AnalyticsSchema");
    AuthTokens.findOne({
        userid: req.user._id,
        "facebook.isValid": true
    }, function(err, res_db) {
        if (err || res_db === null) return res.status(500).send("database failure or null result :" + JSON.stringify(err));
        request.get({
            url: "https://graph.facebook.com/v2.6/" + res_db.facebook.page + "?fields=fan_count&access_token=" + res_db.facebook.access_token
                // url: "https://graph.facebook.com/v2.6/currentPageId?fields=fan_count&access_token=EAAYcT55aAh8BACsazSJZBbYCUZAXZC6RT4SmxJSoUNvfRBwktGJbZCy7qHHrYhNHhWJLKmrxDzyUssuLPS6IsfNNbALlSbP9MZCEbIXXArfZC2UkWm77iuhcNnEUi4RgzDpNjapCzMZAfGBJwUy9PF6ZBXozYz1JICTHcaMXxhAfWq2ngvM7Qgeh"
        }, function(err, response_facebook) {
            if (err) {
                res.statusCode = 500;
                res.send("Internal server error");
                return;
            }
            response_facebook.body = JSON.parse(response_facebook.body);
            (new AnalyticsSchema({
                userid: req.user._id,
                socialid: 'facebook',
                data: {
                    count: response_facebook.body.fan_count,
                    date: new Date()
                }
            })).save();
        });
    });
});

/*puneet facebook re single*/
router.post("/facebook", function(req, res, done) {
    var AuthTokens = mongoose.model("AuthTokens"),
        AnalyticsSchema = mongoose.model("AnalyticsSchema");
    if (!req.user) return res.status(409).send("User not login into sound cloud");
    if (req.body.access_token) {
        //register user and send success
        return AuthTokens.update({
                userid: req.user._id
            }, {
                $set: {
                    "facebook.isValid": false,
                    "facebook.access_token": req.body.access_token,
                    "facebook.page": ""
                }
            }, {
                strict: false,
                multi: true,
                upsert: true
            },
            function(err_db, res_db_update) {
                if (!err_db) {
                    /*Get pages list and show that to user*/
                    graph.setAccessToken(req.body.access_token);
                    graph.get("me/accounts", function(err, res_fb) {
                        if (err) {
                            console.log("Error while executing graph API:" + JSON.stringify(err));
                            return;
                        } else {
                            var response = [];
                            for (var i = 0; i < res_fb.data.length; i++) {
                                response.push({
                                    category: res_fb.data[i].category,
                                    name: res_fb.data[i].name,
                                    id: res_fb.data[i].id
                                });
                            }
                            console.log(res_fb);
                            console.log(response);
                            graph.get('/me/', function(err, res_me) {
                                if (!err) {
                                    return res.send({
                                        pages: response,
                                        username: res_me.name,
                                        id: res_me.id
                                    });
                                } else {
                                    console.log("Unknown error :" + err);
                                }
                            });
                        }
                    });
                } else {
                    console.log(JSON.stringify(err_db));
                    return res.status(403).send("database error!");
                }
            });
    }
    if (req.body.pageid) {
        //register user and send success
        return AuthTokens.update({
                userid: req.user._id
            }, {
                $set: {
                    "facebook.page": req.body.pageid,
                    "facebook.isValid": true
                }
            }, {
                strict: false,
                multi: true,
                upsert: true
            },
            function(err_db, res_db_update) {
                if (!err_db) return res.send("successful registration");
                else return res.status(403).send("database error!");
            });
    }
    AuthTokens.findOne({
        userid: req.user._id
    }, {
        facebook: 1
    }, function(err_db, res_db) {
        if (err_db || !res_db || !res_db.facebook || !res_db.facebook.isValid) {
            //user has not yet registered
            return res.status(404).send("entry not found");
        } else {
            var day_limit = req.body.day_limit || 7;
            AnalyticsSchema.find({
                userid: req.user._id,
                socialid: "facebook"
            }, function(err, res_analytics) {
                if (err) return res.status(500).send("Internal server error");
                var output = {};
                for (var i = 0; i < res_analytics.length; i++) {
                    output[res_analytics[i].data.date.toISOString()] = res_analytics[i].data.count;
                }
                res.send(output);
            }).sort({
                _id: -1
            }).limit(day_limit * 4);
        }
    });
});

/*Get pages administered by the user
req.body->{
token : access token of facebook
}
*/

router.get("/twitter/generate", function(req, res, done) {
    var AuthTokens = mongoose.model("AuthTokens"),
        AnalyticsSchema = mongoose.model("AnalyticsSchema");
    AuthTokens.findOne({
        userid: req.user._id,
        "twitter.isValid": true
    }, function(err, db_res) {
        if (err || !db_res) {
            return res.send("Record not found, please register");
        }
        var client = new Twitter({
            // consumer_key: "HtFNqGObOo2O4IkzL1gasudPJ",
            // consumer_secret: "bjDsl0XUZmcSLIWIl83lhkKRxJ3E99yvmRpYxQvCpbgL0kn4fN",
            consumer_key: socialconf.socialSecres.twitter.consumer_key,
            consumer_secret: socialconf.socialSecres.twitter.consumer_secret,
            access_token_key: db_res.twitter.access_token,
            access_token_secret: db_res.twitter.access_secret
        });
        client.get('favorites/list.json', function(error, tweets, response) {
            if (error) {
                res.statusCode = 500;
                res.send("Internal server error");
                return;
            }
            (new AnalyticsSchema({
                userid: req.user._id,
                socialid: 'twitter',
                data: {
                    count: JSON.parse(response.body)[0].user.followers_count,
                    date: new Date()
                }
            })).save();
        });
    });
});


//Twitter Analytics API
router.post("/twitter", function(req, res, done) {
    var AuthTokens = mongoose.model("AuthTokens"),
        AnalyticsSchema = mongoose.model("AnalyticsSchema");
    if (req.body.access_token_key && req.body.access_token_secret && req.user._id) { //call for twitter
        return AuthTokens.update({
            userid: req.user._id
        }, {
            twitter: {
                isValid: true,
                access_token: req.body.access_token_key,
                access_secret: req.body.access_token_secret,
                screen_name: req.body.screen_name
            }
        }, {
            strict: false,
            upsert: true,
            multi: true
        }, function(err, nMod) {
            if (err) {
                console.log("error while registering instagram user :" + err);
                res.statusCode = 500;
                res.send("Internal server error");
                return;
            }
            res.send("ok registered");
        });
    }
    AuthTokens.findOne({
        userid: req.user._id,
        "twitter.isValid": true
    }, function(err, res_db) {
        if (err || !res_db) {
            res.statusCode = 500;
            res.send("Internal server error");
            return;
        }
        var day_limit = req.body.day_limit || 7;
        AnalyticsSchema.find({
            userid: req.user._id,
            socialid: "twitter"
        }, function(err, res_analytics) {
            if (err) {
                res.statusCode = 500;
                res.send("Internal server error");
                return;
            }
            var output = {};
            for (var i = 0; i < res_analytics.length; i++) {
                output[res_analytics[i].data.date.toISOString()] = res_analytics[i].data.count;
            }
            res.send(output);
        }).sort({
            _id: -1
        }).limit(day_limit * 4);
    });
});

////Youtube analytics inititate api ---temp,will goto cron area later
router.get("/youtube/stats/generate", function(req, res, done) {
    var AuthTokens = mongoose.model("AuthTokens"),
        AnalyticsSchema = mongoose.model("AnalyticsSchema");
    AuthTokens.findOne({
        userid: req.user._id,
        "youtube.isValid": true
    }, function(err, res_db) {
        if (err || res_db === null) {
            res.statusCode = 401;
            res.send("database failure or null result :" + JSON.stringify(err));
            return;
        }
        request.get({
            url: "https://content.googleapis.com/youtube/v3/channels?part=statistics%2CcontentOwnerDetails&key=AIzaSyAMTf33Kl3OKP1ECNxhGT-qgg8zr_rB3LY&id=" + res_db.youtube.channel
        }, function(err, response_youtube) {
            if (err) {
                res.statusCode = 500;
                res.send("Internal server error");
                return;
            }
            response_youtube.body = JSON.parse(response_youtube.body);
            (new AnalyticsSchema({
                userid: req.user._id,
                socialid: 'youtube',
                data: {
                    count: response_youtube.body.items[0].statistics.subscriberCount,
                    date: new Date()
                }
            })).save();
        });
    });
});
////Youtube analytics inititate api ---temp,will goto cron area later --cron

//Youtube analytics api
router.post("/youtube/stats", function(req, res, done) {
    var AuthTokens = mongoose.model("AuthTokens"),
        AnalyticsSchema = mongoose.model("AnalyticsSchema");
    if (req.body.register && req.body.channelId) {
        return AuthTokens.update({
            userid: req.user._id
        }, {
            $set: {
                "youtube.isValid": true,
                "youtube.channel": req.body.channelId
            }
        }, {
            strict: false,
            multi: true
        }, function(err, result_db_update) {
            if (err) {
                res.statusCode = 500;
                return res.send("Internal Error");
            } else {
                return res.send("success");
            }
        });
    } else {
        AuthTokens.findOne({
            userid: req.user._id,
            "youtube.isValid": true
        }, function(err, res_db) {
            if (err || res_db === null) {
                res.statusCode = 401;
                res.send("database failure or null result :" + JSON.stringify(err));
                return;
            }
            var day_limit = req.body.day_limit || 7;
            AnalyticsSchema.find({
                userid: req.user._id,
                socialid: "youtube"
            }, function(err, res_analytics) {
                if (err) {
                    res.statusCode = 500;
                    res.send("Internal server error");
                    return;
                }
                var output = {};
                for (var i = 0; i < res_analytics.length; i++) {
                    output[res_analytics[i].data.date.toISOString()] = res_analytics[i].data.count;
                }
                res.send(output);
            }).sort({
                _id: -1
            }).limit(day_limit * 4); //we sample 4 times a day, assuming this
        });
    }
});

/*Instagram cron to be automated later */
router.get("/instagram/generate", function(req, res, done) {
    var AuthTokens = mongoose.model("AuthTokens"),
        AnalyticsSchema = mongoose.model("AnalyticsSchema");
    AuthTokens.findOne({
        userid: req.user._id,
        "instagram.isValid": true
    }, function(err, db_res) {
        if (err || !db_res) {
            res.statusCode = 500;
            return res.send("Record not found, please register");
        }
        var ig = require('instagram-node').instagram();
        ig.use({
            client_id: socialconf.socialSecres.instagram.client_id,
            client_secret: socialconf.socialSecres.instagram.client_secret,
            access_token: db_res.instagram.access_token
        });
        ig.user('self', function(err, result, remaining, limit) {
            if (err) { //may be token has expired, set a value to indicate token expiry and handle it :
                return console.log("Error from instagram analytics api" + err);
            }
            (new AnalyticsSchema({
                userid: req.user._id,
                socialid: 'instagram',
                data: {
                    count: result.counts.follows,
                    date: new Date()
                }
            })).save();
        });
    });
});

router.post("/instagram", function(req, res, done) {
    var AuthTokens = mongoose.model("AuthTokens"),
        AnalyticsSchema = mongoose.model("AnalyticsSchema");
    if (req.body.access_token) { //call for registration
        return AuthTokens.update({
            userid: req.user._id
        }, {
            instagram: {
                isValid: true,
                access_token: req.body.access_token
            }
        }, {
            strict: false,
            upsert: true
        }, function(err, nMod) {
            if (err) {
                console.log("error while registering instagram user :" + err);
                res.statusCode = 500;
                res.send("Internal server error");
                return;
            }
            res.send("ok registered");
        });
    }
    AuthTokens.findOne({
        userid: req.user._id,
        "instagram.isValid": true
    }, function(err, res_db) {
        if (err || !res_db) {
            res.statusCode = 500;
            res.send("Internal server error");
            return;
        }
        var day_limit = req.body.day_limit || 7;
        AnalyticsSchema.find({
            userid: req.user._id,
            socialid: "instagram"
        }, function(err, res_analytics) {
            if (err) {
                res.statusCode = 500;
                res.send("Internal server error");
                return;
            }
            var output = {};
            for (var i = 0; i < res_analytics.length; i++) {
                output[res_analytics[i].data.date.toISOString()] = res_analytics[i].data.count;
            }
            res.send(output);
        }).sort({
            _id: -1
        }).limit(day_limit);
    });
    // //Dynamic Variables Start
    // req.body.userid = req.user._id;
    // //  req.body.access_token = req.body.access_token ? req.body.access_token : '3201298647.1677ed0.7963843bb7ae48928ed36f6615844731';
    // //Dynamic Variables End
    // if (!req.body.access_token || !req.body.userid) {
    //     res.statusCode = 401;
    //     res.send("Authorization failed");
    // }
    // var ig = require('instagram-node').instagram();
    // ig.use({
    //     client_id: 'ae84968993fc4adf9b2cd246b763bf6b',
    //     client_secret: '2fb6196d81064e94a8877285779274d6',
    //     access_token: req.body.access_token
    // });
    // ig.user('self', function(err, result, remaining, limit) {
    //     if (err) {
    //         console.log("Error from instagram analytics api" + err);
    //         return;
    //     }
    //     var Instagram = mongoose.model('Instagram');
    //     //search if userid(artistUnlimited) is in database, otherwise create entry
    //     Instagram.find({
    //         userid: req.body.userid
    //     }, function(err, response_database) {
    //         if (err) {
    //             console.log("Error from database, instagram_schema :" + err);
    //             return;
    //         }
    //         var save_database;
    //         if (response_database.length !== 0) {
    //             //entry in database
    //             result.userid = req.body.userid;
    //             if (result.counts.followed_by !== response_database[0].counts.followed_by) {
    //                 save_database = new Instagram(result);
    //                 save_database.save(function(err) {
    //                     if (err) {
    //                         console.log("fatal error while saving :" + err);
    //                         return;
    //                     } else {
    //                     }
    //                 });
    //             } else {
    //                 res.send(formatResponse(response_database));
    //             }
    //         } else {
    //             //entry not in database
    //             result.userid = req.body.userid;
    //             save_database = new Instagram(result);
    //             save_database.save(function(err) {
    //                 if (err) {
    //                     console.log("fatal error while saving :" + err);
    //                     return;
    //                 } else {
    //                     res.send(formatResponse([save_database]));
    //                 }
    //             });
    //         }
    //     }).sort({
    //         _id: -1
    //     }).limit(6).lean();
    //  });

    // function formatResponse(input) {
    //     console.log(JSON.stringify(input));
    //     var output = {};
    //     for (var i = 0; i < input.length; i++) {
    //         output[input[i]._id.getTimestamp().toISOString()] = input[i].counts.followed_by;
    //     }
    //     return output;
    // }
});
