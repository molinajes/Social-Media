var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var request = require('request');
var queryString = require('query-string');
var scClientID = require('./../../../env').SOUNDCLOUD.clientID;
var SCResolve = require('soundcloud-resolve-jsonp/node');
var http = require('http');

router.post('/', function(req, res, next) {
  if (req.body.q.includes("soundcloud.com")) {
    resolveURL(req.body.q)
      .then(function(item) {
        var sendObj = {
          item: item,
          searchString: req.body.q,
          collection: []
        }
        res.send(sendObj);
      })
      .then(null, next);
  } else {
    Promise.all([acSearch(req.body.q, req.body.kind), regSearch(req.body.q, req.body.kind)])
      .then(function(results) {
        var searchArray = results[0].concat(results[1]);
        var sendObj = {
          searchString: req.body.q,
          collection: searchArray
        }
        res.send(sendObj);
      }).then(null, next)
  }
})


function acSearch(q, kind) {
  var acQuery = {
    q: q,
    client_id: scClientID,
    limit: 10
  };
  return (new Promise(function(fulfill, reject) {
    var autocompleteSearch = 'https://api-v2.soundcloud.com/search/autocomplete?' + queryString.stringify(acQuery);
    request.get(autocompleteSearch, function(err, response, body) {
      if (err) reject(err);
      else {
        try {
          var autoResults = JSON.parse(body).results.filter(function(obj) {
            return obj.kind == kind;
          })
          fulfill(Promise.all(autoResults.slice(0, 3).map(function(result) {
            return resolveURL(result.entity.permalink_url)
              .then(function(item) {
                return item;
              })
              .then(null, reject);
          })));
        } catch (e) {
          reject(e);
        }
      }
    });
  }))
}

function resolveURL(url) {
  return (new Promise(function(fulfill, reject) {
    try {
      http.get('http://api.soundcloud.com/resolve?url=' + url + '&client_id=' + scClientID, function(res) {
        var body = "";
        res.on('data', function(chunk) {
          body += chunk
        });
        res.on('end', function() {
          try {
            var location = JSON.parse(body).location;
          } catch (e) {
            reject(e);
          }
          request.get(location, function(err, response, body) {
            if (err) {
              reject(err)
            } else if (response.statusCode == 403) {
              var endIndex = location.indexOf('?client_id');
              var startIndex = location.indexOf('/tracks/') + 8;
              var id = location.slice(startIndex, endIndex);
              fulfill({
                title: '--unknown--',
                user: {
                  username: "--unknown--"
                },
                permalink_url: url,
                kind: "track",
                id: id
              });
            } else {
              try {
                body = JSON.parse(body)
                fulfill(body);
              } catch (e) {
                reject(e)
              }
            }
          });
        })
      }).on('error', reject);
    } catch (e) {
      reject(e)
    }
  }))
}

function regSearch(q, kind) {
  var sQuery = {
    q: q,
    client_id: scClientID,
    limit: kind == 'playlist' ? 100 : 50
  };
  return (new Promise(function(fulfill, reject) {
    var regularSearch = 'https://api-v2.soundcloud.com/search?' + queryString.stringify(sQuery)
    request.get(regularSearch, function(err, response, regResults) {
      if (err) reject(err);
      try {
        var regResults = JSON.parse(regResults).collection.filter(function(obj) {
          return obj.kind == kind;
        })
        fulfill(regResults.slice(0, 20))
      } catch (e) {
        reject(e)
      }
    });
  }))

}