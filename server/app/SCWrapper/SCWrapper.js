'use strict';
var https = require('https');
var qs = require('querystring');
var hostApi = 'api.soundcloud.com';

module.exports = (function() {
  function SCWrapper() {
    // Not yet authorized or initialized by default
    this.isAuthorized = false;
    this.isInit = false;
  }

  SCWrapper.prototype.init = function(options) {
    this.clientId = options.id;
    this.clientSecret = options.secret;
    this.redirectUri = options.uri;
    if (options.accessToken) {
      this.setToken(options.accessToken);
    }
    this.isInit = true;
  };

  SCWrapper.prototype.setToken = function(token) {
    this.accessToken = token;
    this.isAuthorized = true;
  };

  SCWrapper.prototype.request = function(data, callback) {
    var qsObj = data.qs;
    if (!qsObj) {
      qsObj = {
        client_id: this.clientId,
        format: 'json'
      };
    } else {
      qsObj.client_id = this.clientId;
      qsObj.format = 'json';
    }

    if ((data.path.split('/')[1] === 'me' || data.path.split('/')[0]) && !qsObj.oauth_token) {
      if (this.isAuthorized) {
        qsObj.oauth_token = this.accessToken;
      } else {
        callback({
          message: 'Not authorized to use path: ' + data.path
        });
        return false;
      }
    }

    var qsdata = (qsObj) ? qs.stringify(qsObj) : '';
    var paramChar = data.path.indexOf('?') >= 0 ? '&' : '?';
    var options = {
      hostname: hostApi,
      path: data.path + paramChar + qsdata,
      method: data.method
    };

    if (data.method === 'POST') {
      options.path = data.path;
      options.headers = {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': qsdata.length
      };
    }
    var req = https.request(options, function(response) {
      var body = ' ';
      response.on('data', function(chunk) {
        body += chunk;
      });
      response.on('end', function() {
        try {
          var d = JSON.parse(body);
          if (Number(response.statusCode) >= 400) {
            callback(d.errors, d);
          } else {
            callback(undefined, d);
          }
        } catch (e) {
          if (response.statusCode < 400) {
            callback(undefined, body);
          } else {
            callback(body, undefined);
          }
        }
      });
    });

    req.on('error', function(e) {
      callback(e, undefined);
    });

    if (data.method === 'POST') {
      req.write(qsdata);
    }
    return req.end();
  }

  return new SCWrapper();
})();
