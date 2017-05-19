var SCR = require('soundclouder');
var client_id = "1e57616d882f00c402ff95abd1f67b39";
var client_secret = "0934d66f53f5dcd06a1ce9f32e9a6267";
var redirect_uri = "facebook.com";

var aT = "1-183955-147045855-0b443e23cd3ba";
var id = 252166676;
SCR.init(client_id, client_secret, redirect_uri);
SCR.put('/me/track_reposts/' + id, aT, function(err, data) {
  console.log(err);
  console.log(data);
});