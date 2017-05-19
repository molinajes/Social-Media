var request = require('request');

request.get('https://api-v2.soundcloud.com/search?q=max%20milner%20like%20me%20slightly&client_id=02gUJC0hH2ct1EGOcYXQIzRFU91c72Ea&limit=10', function(err, res, body) {
  console.log(body)
});

https: //api-v2.soundcloud.com/search/autocomplete?q=david%20ayscue&client_id=02gUJC0hH2ct1EGOcYXQIzRFU91c72Ea