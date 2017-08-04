app.config(function($stateProvider) {
  $stateProvider
    .state('artistToolsAnalytics', {
      url: '/analytics',
      params: {
        submission: null
      },
      templateUrl: 'js/artistTools/Analytics/analytics.html',
      controller: 'artistToolsAnalytics'
    });
});

app.controller("artistToolsAnalytics", function($rootScope, $state, $stateParams, $scope, $http, $location, $window, $uibModal, $timeout, $auth, SessionService, ArtistToolsService) {
  $scope.user = SessionService.getUser();
  if (!SessionService.getUser()) {
    $state.go('login');
  } else {
    $window.localStorage.removeItem('returnstate');
    $window.localStorage.removeItem('tid');
  }
  $scope.authFacbook = function(id, days) {
    if (id) { //calling for registration !
      alert("registering Channel, please refresh after few moments to load analytics data");
      return $http({
        method: 'POST',
        url: '/api/analytics/facebook',
        data: {
          pageid: id.id
        }
      }).then(function(success) {
        $scope.showFacebookPages = false;
        delete $scope.facebookPages;
        console.log(success);
        $scope.authFacbook();
      }, function(error) {
        console.log(error);
      });
    }
    $scope.enableGraph = false;
    $http({
      method: 'POST',
      url: '/api/analytics/facebook',
      data: {
        day_limit: days
      }
    }).success(function(success_http) {
      $scope.displayError = false;
      $scope.daysCallbackFunction = 'authFacbook';
      $scope.showDayChanger = true;
      $scope.graph_data = success_http;
      $scope.enableGraph = true;
    }).error(function() {
      FB.login(function(response_token, success) {
        if (!response_token.authResponse) return console.log("User did not authorize fully!");
        $http({
          method: 'POST',
          url: '/api/analytics/facebook',
          data: {
            access_token: response_token.authResponse.accessToken
          }
        }).success(function(response) {
          $scope.facebookPages = response.pages;
          $scope.showFacebookPages = true;
        }).error(function(error) {
          alert("Error while registering page :" + error);
        });
        //$scope.accessToken = response_token.accessToken;
      }, {
        scope: 'pages_show_list,user_likes'
      });
    });
  };

  $scope.authTwitter = function(acccess_key, days) {
    $scope.showDayChanger = false;
    $scope.enableGraph = false;
    $http({
      method: 'POST',
      url: '/api/analytics/twitter',
      data: {
        day_limit: days
      }
    }).then(function(success) {
      $scope.daysCallbackFunction = 'authTwitter';
      $scope.showDayChanger = true;
      $scope.graph_data = success.data;
      $scope.enableGraph = true;
    }, function(failure) {
      $auth.authenticate('twitter').then(function(success_twitter) {
        $http({
          method: 'POST',
          url: '/api/analytics/twitter',
          data: {
            access_token_key: success_twitter.data.oauth_token,
            access_token_secret: success_twitter.data.oauth_token_secret,
            screen_name: success_twitter.data.screen_name
          }
        }).then(function(success) {
          $scope.showFollowers = false;
          $scope.authTwitter();
        }, function(error) {
          console.log(error);
        });
      });
    });
  };

  $scope.authInstagram = function(channelId, days) {
    $scope.showDayChanger = false;
    $scope.enableGraph = false;
    $http({
      method: 'POST',
      url: '/api/analytics/instagram',
      data: {
        day_limit: days
      }
    }).then(function(success) {
      $scope.daysCallbackFunction = 'authInstagram';
      $scope.showDayChanger = true;
      $scope.graph_data = success.data;
      $scope.enableGraph = true;
    }, function(failure) {
      $auth.authenticate('instagram').then(function(success) {
        $http({
          method: 'POST',
          url: '/api/analytics/instagram',
          data: {
            access_token: success.access_token
          }
        }).then(function(success) {
          $scope.authInstagram();
        }, function(failure) {
          return console.log("<authInstagram>failed when trying to register user" + JSON.stringify(failure));
        });
      }, function(failure) {
        console.log("failure while authentication of instagram" + JSON.stringify(failure));
      });
    });
  };

  $scope.authYoutube = function(channelId, days) {
    $scope.showDayChanger = false;
    if (channelId) { //calling for registration !
      alert("registering Channel, please refresh after few moments to load analytics data");
      return $http({
        method: 'POST',
        url: '/api/analytics/youtube/stats',
        data: {
          register: true,
          channelId: channelId
        }
      }).then(function(success) {
        $scope.showYoutubeChannel = false;
        delete $scope.youtubeChannel;
        console.log(success);
        $scope.authYoutube();
      }, function(error) {
        console.log(error);
      });
    }
    $scope.enableGraph = false;
    $http({
      method: 'POST',
      url: '/api/analytics/youtube/stats',
      data: {
        day_limit: days
      }
    }).success(function(success_http) {
      $scope.displayError = false;
      $scope.daysCallbackFunction = 'authYoutube';
      $scope.showDayChanger = true;
      $scope.graph_data = success_http;
      $scope.enableGraph = true;
    }).error(function() {
      $auth.authenticate('google').then(function(success) {
        $scope.youtubeChannel = success.data;
        $scope.showYoutubeChannel = true;
      }, function(failure) {
        console.log("failed from authorization server>>>>" + JSON.stringify(failure));
      });
    });
  };
  $scope.alert = function(data) {
    alert(data);
  };
});
app.controller('graphControler', function($scope) {
  // $scope.data = [{
  //     key: "Cumulative Return",
  //     values: value_array
  // }];
  $scope.options = {
    margin: {
      top: 20
    },
    series: [{
      axis: "y",
      dataset: "timed",
      key: "val_0",
      label: "Analytics data",
      color: "hsla(88, 48%, 48%, 1)",
      type: [
        "line"
      ],
      id: "mySeries0"
    }],
    axes: {
      x: {
        key: "x",
        type: "date"
      }
    }
  };
  $scope.data = {
    timed: []
  };
  for (var local_data in $scope.graph_data) {
    $scope.data.timed.push({
      x: local_data,
      val_0: $scope.graph_data[local_data]
    });
  }
  for (var i in $scope.data.timed) {
    $scope.data.timed[i].x = new Date($scope.data.timed[i].x);
  }
});