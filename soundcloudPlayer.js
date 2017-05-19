var fs = require('fs');
var http = require('http');
var Promise = require('promise');
var accessTokenArray = ['4720e79b53fc66efaa3818b0992a0284', '5845a670b7680de326470fda240fe602', '373477850828b80b8cae244a4cfe66f5', 'f30dd919b0b02bdfe995966e3e880abb', '5f6af41fad4c66ef0cd83bcb720473cf', '2dd50196cf59c3cca27fc85cb323a37d', '55300fa281c8b2d69f1f710310ca46ff', '1a24eda90ae0d977dae1b7c2b7ccde0d', 'e937b794a67c616bd59eed1a570b44c0', '4a348c975fff6e636f9a861f93eb60d7', 'ff023a620394846dc2abb3cf6b48e4ea', '134e3bd683d8b4772be6b8c29074b029', '8c0fa73ad5c07f83cb21b257b958daad', '38faf7d0e959c949499860f6443afa66', '281e06c3436513c40ff4bc57b57c3d61', '2a09e9a6824d1e3d2a47a621d506228c', '35b9e9a39309f0826891e014e2bbd1eb', 'dfea0737275304bc5cfa2afa261e5314', '73f248979d28333f1c35b88ba66eefd5', '5844ba4405f47cd6f612ca61cbe0af61', 'b7603ae525e2ed951bd061ad7d7e975b', '4563b0f375b4725196ac6c445e72356f', '3f0e61f44d80a2b81f47ffccebdbdd51', '9a8436077c1191a933534b45b8c99081', '4966765694b42b2269d05c21ada46805', '4103215ce8f4abb5c8f7e76f49801853', 'e025796fcfd091786a67949039752229', 'e78561d0d997b19d7348ff9ef6305f31', '229a82c908c781f51b5590e74c59cc41', '346c20974f067901b9d88669a19b9363', '8289e98ddd13dc80f449c0a6244f25ce', 'ded97a304784dfd44239424f2a1aad5c', 'ef03aecd4e67cbcdca84fca2adc7f490', '08d0ad68005a4a1553ab062721f7e3e1', '9f53492361f7a2c7908dff4f24ad5c7b', 'd202f15ef9f73f30dbc2bcc12919d392'];
var numTokens = 36;
var ipArray = fs.readFileSync('./proxyList.txt').toString().replace(/(\r\n|\n|\r)/g, '\n').split('\n');

var timeBetween = 60 * 60 * 1000 * parseFloat(process.env.HOURS_SPAN) / parseFloat(process.env.NUMBER_PLAYS);
var totalPlays = 0;

setTimeout(function() {
  schedulePlays();
}, parseFloat(process.env.HOURS_DELAY) * 60 * 60 * 1000)

function schedulePlays() {
  setTimeout(function() {
    if (totalPlays < process.env.NUMBER_PLAYS) {
      schedulePlays();
    }
  }, timeBetween);
  performPlay();
}

function performPlay() {
  if (totalPlays >= process.env.NUMBER_PLAYS) return;
  var ipIndex = Math.floor(Math.random() * ipArray.length);
  if (ipArray[ipIndex]) {
    var ipAndPort = ipArray[ipIndex].split(':');
    requestPromise(ipAndPort)
      .then(function(ret) {
        totalPlays++;
        console.log('----------success---------');
        console.log(ret);
      }, function(err) {
        console.log(err);
        performPlay();
      })
  } else {
    performPlay();
  }
}

function requestPromise(ipAndPort) {
  return new Promise(function(resolve, reject) {
    var body = '';
    var req = http.request({
      host: ipAndPort[0],
      port: ipAndPort[1],
      method: 'GET',
      path: 'http://api.soundcloud.com/tracks/' + process.env.TRACK_ID + '/stream?client_id=' + accessTokenArray[Math.floor(Math.random() * numTokens)],
      headers: {
        connection: 'keep-alive'
      },
      agent: false
    }, function(res) {
      res.on('data', function(data) {
        body += data;
      });
      res.on('end', function() {
        try {
          // console.log(body);
          var jsonBody = JSON.parse(body);
          if (jsonBody.status == '302 - Found') {
            resolve(body)
          } else {
            reject("Not found");
          }
        } catch (e) {
          reject(e);
        }
      })
    })
    req.setTimeout(20000, function() {
      reject('timed out')
    });
    req.on('error', function(err) {
      reject(err);
    });
    req.end();
  })
}

process.on('uncaughtException', function(err) {
  // console.log('-----critical error-----');
  // console.log(err);
  performPlay();
});