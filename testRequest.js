var request = require('request');

request.post('http://52.26.54.198:1337/api/bots/likes', {
  form: {
    "hoursDelay": 0,
    "hoursSpan": 0.01,
    "numberLikes": 30,
    "trackID": 274511565
  }
}, function(err, response, body) {})