var HTTP = require('http');
var CLIENT_ID = '1e57616d882f00c402ff95abd1f67b39';
var CLIENT_SECRET = '0934d66f53f5dcd06a1ce9f32e9a6267';
var redirect_uri = "https://artistsunlimited.co/callback.html";
var SCResolve = require('soundcloud-resolve-jsonp/node');

process.stdin.resume();

(new Promise(function(fulfill, reject) {
  SCResolve({
    url: process.argv[2],
    client_id: CLIENT_ID
  }, function(err, track) {
    if (err) {
      reject(err);
    } else {
      fulfill(track);
    }
  });
}))
.then(function(track) {
    console.log(track);
  })
  .then(null, console.log);