var SC = require('node-soundcloud');
var SCR = require('soundclouder');
var SCResolve = require('soundcloud-resolve-jsonp/node');
var Promise = require('bluebird');
var HTTPS = require('https');
var scWrapper = require('./server/app/SCWrapper/SCWrapper.js');
var request = require('request');

var client_id = "5c75e089d6ec33d67285c3d1ce641d99";
var client_secret = "a5745fddf575619b0831ad2653f5a563";
var redirect_uri = "https://artistsunlimited.com/callback.html";
var fs = require('fs');

scWrapper.init({
  id: client_id,
  secret: client_secret,
  uri: redirect_uri
});

// SC.init({
//   client_id: client_id,
//   // secret: client_secret,
//   // redirect_uri: redirect_uri
// });

// HTTPS.request({
//     hostname: 'api.soundcloud.com',
//     path: '/e1/me/track_reposts/'+id,
//     method: 'PUT'
//   }, function(res) {
//     var dataChunk = '';
//     res.on('data', function(data) {
//       dataChunk += data;
//     });
//     res.on('end', function() {
//       console.log(dataChunk);
//     })
//   })
//   .on('error', function(err) {
//     throw err;
//   })
//   .end();

var aT = "1-231090-148393-11845152e60d2d6d";
var id = 286840750;
// SCR.init(client_id, client_secret, redirect_uri);
// SC.init(client_id, client_id, redirect_uri);
// SCR.get('/users/' + id, function(err, data) {
//   if (err) {
//     console.log('err');
//     console.log(err);
//   }
//   console.log(data);
// });
// scWrapper.init({
//   id: client_id,
//   secret: client_secret,
//   uri: redirect_uri
// });
// scWrapper.setToken(aT);
// var reqObj = {
//   method: 'PUT',
//   path: '/e1/me/track_reposts/' + id,
//   qs: {
//     oauth_token: aT
//   }
// };
// scWrapper.request(reqObj, function(err, data) {
//   console.log('err -------' + JSON.stringify(err));
//   console.log('data ------' + JSON.stringify(data));
// });

// var total = ""

// function get(url) {
//   request.get(url, function(err, res, body) {
//     if (err) {
//       console.log(err);
//     } else {
//       var body = JSON.parse(body);
//       if (body.next_href) {
//         body.collection.forEach(function(follower) {
//           total += follower.id + ","
//         })
//         get(body.next_href);
//       } else {
//         console.log(total);
//       }
//     }
//   })
// }

// get("http://api.soundcloud.com/users/86560544/followings?client_id=8002f0f8326d869668523d8e45a53b90&page_size=200")


var at = '1-264177-253561592-86b16a3ffa1dc';

scWrapper.setToken(at);
var reqObj = {
  method: 'GET',
  path: '/me',
  qs: {}
};
scWrapper.request(reqObj, function(err, data) {
  if (err) {
    console.log('err');
    console.log(err);
  } else {
    console.log(data)
  }
});
