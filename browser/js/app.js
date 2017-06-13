'use strict';
window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'ngCookies', 'yaru22.angular-timeago', 'satellizer', 'angularMoment', 'luegg.directives', 'ui-rangeSlider', 'ngSanitize', 'colorpicker.module', 'ngclipboard', 'ui.sortable']);

app.config(function($urlRouterProvider, $locationProvider, $uiViewScrollProvider, $httpProvider) {
  // This turns off hashbang urls (/#about) and changes it to something normal (/about)
  $locationProvider.html5Mode(true);
  // If we go to a URL that ui-router doesn't have registered, go to the "/" url.
  $urlRouterProvider.otherwise('/');
  // $uiViewScrollProvider.useAnchorScroll();

  //intercept all incoming and outgoing requests
  $httpProvider.interceptors.push(function() {
    return {
      'request': function(config) {
        return config;
      },
      'response': function(response) {
        // if (typeof response.data != 'string')
        //     console.log(response.data);
        return response;
      }
    };
  });
});
app.config(function($authProvider) {
  $authProvider.facebook({
    clientId: 'Facebook App ID'
  });

  // Optional: For client-side use (Implicit Grant), set responseType to 'token'
  $authProvider.facebook({
    clientId: 'Facebook App ID',
    responseType: 'token'
  });

  $authProvider.google({
    optionalUrlParams: ['access_type'],
    accessType: 'offline',
    url: '/api/login/google/',
    clientId: '923811958466-kthtaatodor5mqq0pf5ub6km9msii82g.apps.googleusercontent.com',
    scope: ['https://www.googleapis.com/auth/youtubepartner-channel-audit', 'https://www.googleapis.com/auth/youtube'],
    redirectUri: window.location.origin + '/analytics'
  });
  // redirectUri: window.location.origin+'/analytics'
  //    responseType: 'token'
  $authProvider.github({
    clientId: 'GitHub Client ID'
  });

  $authProvider.linkedin({
    clientId: 'LinkedIn Client ID'
  });

  $authProvider.instagram({
    clientId: 'ae84968993fc4adf9b2cd246b763bf6b',
    responseType: 'token'
  });

  $authProvider.yahoo({
    clientId: 'Yahoo Client ID / Consumer Key'
  });

  $authProvider.live({
    clientId: 'Microsoft Client ID'
  });

  $authProvider.twitch({
    clientId: '727419002511745024'
  });

  $authProvider.bitbucket({
    clientId: 'Bitbucket Client ID'
  });


  // No additional setup required for Twitter
  $authProvider.oauth2({
    name: 'foursquare',
    url: '/auth/foursquare',
    clientId: 'Foursquare Client ID',
    redirectUri: window.location.origin,
    authorizationEndpoint: 'https://foursquare.com/oauth2/authenticate',
  });
});
// This app.run is for controlling access to specific states.
app.run(function($rootScope, $window, $http, AuthService, $state, $uiViewScroll, SessionService, AppConfig) {

  // The given state requires an authenticated user.
  // var destinationStateRequiresAuth = function (state) {
  //     return state.data && state.data.authenticate;
  // };

  AppConfig.fetchConfig().then(function(res) {
    // console.log(res);
    AppConfig.setConfig(res.data);
    // console.log(AppConfig.isConfigParamsvailable);
  })

  // $stateChangeStart is an event fired
  // whenever the process of changing a state begins.
  $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
    if (toState.name == 'reForReInteraction') {
      $rootScope.state = false;
    } else {
      $rootScope.state = true;
    }

    if ($window.location.pathname.indexOf('artistTools') != -1 || $window.location.pathname.indexOf('admin') != -1) {
      var user = SessionService.getUser();
      if (user) {
        var isAdminAuthenticate = ($window.localStorage.getItem('isAdminAuthenticate') ? $window.localStorage.getItem('isAdminAuthenticate') : false);
        var redirectPath = (isAdminAuthenticate ? "/admin" : "/login");
        //console.log(redirectPath + " rascal redirectPath");
        //console.log($window.location.pathname + " $window.location.pathname");
        //console.log(isAdminAuthenticate + " rasca  isAdminAuthenticate");
        if ($window.location.pathname.indexOf('admin') != -1 && !isAdminAuthenticate) {
          //console.log(user + "app.js user");
          $http.post('/api/logout').then(function() {
            SessionService.deleteUser();
            $state.go('admin');
            //window.location.href = '/admin';
          });
        } else if ($window.location.pathname.indexOf('artistTools') != -1 && isAdminAuthenticate) {
          $http.get('/api/users/isUserAuthenticate').then(function(res) {
            if (!res.data) {
              SessionService.deleteUser();
              $window.location.href = redirectPath;
            }
          });
        }
      }
    };

    var user = SessionService.getUser();
    if (!user) {
      if ($window.location.pathname.indexOf('admin/') != -1) {
        $http.post('/api/logout').then(function() {
          SessionService.deleteUser();
          $window.location.href = '/admin';
        });
      } else if ($window.location.pathname.indexOf('artistTools/') != -1) {
        $http.get('/api/users/isUserAuthenticate').then(function(res) {
          if (!res.data) {
            SessionService.deleteUser();
            $window.location.href = '/login';
          }
        });
      }
    }
  });
  SessionService.refreshUser();

  $rootScope.reloadFB = function() {
    setTimeout(function() {
      FB.init({
        appId: "1771378846475599",
        xfbml: true,
        version: "v2.6"
      });
      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) {
          return;
        }
        js = d.createElement(s);
        js.id = id;
        js.src = "//connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    }, 500);
  }
});

app.directive('fbLike', [
  '$window', '$rootScope',
  function($window, $rootScope) {
    return {
      restrict: 'A',
      scope: {
        fbLike: '=?'
      },
      link: function(scope, element, attrs) {
        if (!$window.FB) {
          // Load Facebook SDK if not already loaded
          $.getScript('//connect.facebook.net/en_US/sdk.js', function() {
            $window.FB.init({
              appId: $rootScope.facebookAppId,
              xfbml: true,
              version: 'v2.0'
            });
            renderLikeButton();
          });
        } else {
          renderLikeButton();
        }

        var watchAdded = false;

        function renderLikeButton() {
          if (!!attrs.fbLike && !scope.fbLike && !watchAdded) {
            // wait for data if it hasn't loaded yet
            watchAdded = true;
            var unbindWatch = scope.$watch('fbLike', function(newValue, oldValue) {
              if (newValue) {
                renderLikeButton();
                // only need to run once
                unbindWatch();
              }
            });
            return;
          } else {
            element.html('<div class="fb-like"' + (!!scope.fbLike ? ' data-href="' + scope.fbLike + '"' : '') + ' data-layout="button_count" data-action="like" data-show-faces="true" data-share="true"></div>');
            $window.FB.XFBML.parse(element.parent()[0]);
          }
        }
      }
    };
  }
])

app.controller('FullstackGeneratedController', function($stateParams, $window, $rootScope, $scope, $state, $http, mainService, SessionService, AuthService) {
  /*Load More*/
  $scope.user = SessionService.getUser();
  $rootScope.enableNavigation = false;
  $scope.embedded = window.location.search.includes("embed");
  $scope.isBlock = function() {
    $scope.todayDate = new Date();
    $scope.blockRelease = new Date($scope.user.blockRelease);
    $scope.isBlock = $scope.todayDate < $scope.blockRelease ? true : false;
    return $scope.isBlock;
  }

  $scope.loadList = function() {
    $scope.$broadcast('loadTrades');
  }

  $scope.submissionsCount = 0;
  $scope.premiereCount = 0;
  $scope.inboxTrades = 0;
  $scope.shownotification = false;
  $scope.logout = function() {
    mainService.logout();
  }
  $scope.adminlogout = function() {
    mainService.adminlogout();
  }

  $scope.getSubmissionCount = function() {
    $http.get('/api/submissions/counts').then(function(res) {
      $scope.submissionsCount = res.data.regularCount + res.data.marketCount;
      console.log($scope.submissionsCount);
    });
    $http.get('/api/premier/count').then(function(res) {
      $scope.premiereCount = res.data.count;
      console.log($scope.premiereCount);
    })
  }
  if (window.location.href.includes('/admin') && $scope.user) $scope.getSubmissionCount();

  $scope.getIncompleteTradesCount = function() {
    if (!!$scope.user) {
      $scope.inboxTrades = 0;
      $http.get('/api/trades/withUser/' + $scope.user._id).then(function(res) {
        var trades = res.data;
        trades = trades.filter(function(trade) {
          return (!!trade.p1.user && !!trade.p2.user)
        })
        if ($scope.user.role == 'admin') {
          var paidRepostIds = [];
          if ($scope.user.paidRepost.length > 0) {
            $scope.user.paidRepost.forEach(function(acc) {
              paidRepostIds.push(acc.userID);
            })
          }
          trades.forEach(function(trade) {
            trade.other = paidRepostIds.includes(trade.p1.user._id) ? trade.p2 : trade.p1;
            if (trade.other.accepted) $scope.inboxTrades++;
          });
        } else {
          trades.forEach(function(trade) {
            trade.other = (trade.p1.user._id == $scope.user._id) ? trade.p2 : trade.p1;
            if (trade.other.accepted) $scope.inboxTrades++;
          });
        }
      }).then(null, console.log)
    }
  }
  $scope.getIncompleteTradesCount();

  $scope.gotoSettings = function() {
    $scope.user = SessionService.getUser();
    SessionService.addActionsfoAccount('Admin', $scope.user._id)
    $state.go("basicstep1");
  }

  $scope.getBehalfUserRecord = function(paid) {
    paid = JSON.parse(paid);
    SessionService.removePaidRepostAccounts();
    setTimeout(function() {
      SessionService.addActionsfoAccount('BehalfUser', paid._id, paid.soundcloud.id);
      SessionService.setUserPaidRepostAccounts(paid);
      if ($state.current.url.indexOf("admin/trade") != -1)
        window.location.href = '/admin/reposttraders';
      else
        window.location.reload($state.current.url);
    }, 500);
  }

  $scope.gotoBehalfSetting = function(actions) {
    if (actions == "SCHEDULER") {
      window.location.href = '/admin/scheduler';
    }
    if (actions == "REPOSTTRADES") {
      window.location.href = '/admin/trade';
    }
    if (actions == "DOWNLOADGATEWAY") {
      window.location.href = '/admin/downloadGateway';
    }
  }

  $scope.openHelpModal = function() {
      $.Zebra_Dialog("Do you have a question? Email us and we'll get back to you promptly.", {
        'type': 'question',
        'buttons': [{
          caption: 'Cancel',
          callback: function() {}
        }, {
          caption: 'Email Tech Support',
          callback: function() {
            window.location.href = "mailto:coayscue@artistsunlimited.com?subject=Support";
          }
        }]
      });
    }
    /*$scope.checkNotification = function() {
        var user = SessionService.getUser();
        if (user) {
            return $http.get('/api/trades/withUser/' + user._id)
                .then(function(res) {
                    var trades = res.data;
                    trades.forEach(function(trade) {
                        if (trade.p1.user._id == user._id) {
                            if (trade.p1.alert == "change") {
                                $scope.shownotification = true;
                            }
                        }
                        if (trade.p2.user._id == user._id) {
                            if (trade.p2.alert == "change") {
                                $scope.shownotification = true;
                            }
                        }
                    });
                })
        }
    }*/

  $scope.setCurUser = function() {
    $scope.curATUser = JSON.stringify(SessionService.getUser());
  }


  $scope.rootSoundcloudLogin = function() {
    $scope.processing = true;
    SC.connect()
      .then(function(res) {
        $rootScope.accessToken = res.oauth_token;
        return $http.post('/api/login/soundCloudLogin', {
          token: res.oauth_token,
          password: 'test'
        });
      })
      .then(function(res) {
        $scope.processing = false;
        var userData = res.data.user;
        userData.isAdmin = false;
        SessionService.create(userData);
        $scope.user = SessionService.getUser();
        if (window.location.href.includes('/admin')) window.location.href = '/admin/scheduler'
        else window.location.reload();
      })
      .then(null, function(err) {
        console.log(err);
        $scope.processing = false;
        $scope.soundcloudLogin();
      });
  };


  $rootScope.changeUserAdmin = $scope.changeUserAdmin = function(param, location, state) {
    if (!param) return;
    $scope.processing = true;
    if (typeof param == 'string' && param.length > 15) param = JSON.parse(param);
    if (param == 'user') {
      var prevATUser = JSON.parse($window.localStorage.getItem('prevATUser'));
      if (SessionService.getUser()._id != prevATUser._id) {
        $scope.processing = true;
        return $http.post('/api/login/soundCloudLogin', {
            token: prevATUser.soundcloud.token,
            password: 'test'
          })
          .then(function(res) {
            $scope.processing = false;
            SessionService.create(res.data.user);
            $scope.curATUser = SessionService.getUser()
              // if (state) $state.go(state);
            if (location) window.location.href = location;
            else window.location.reload();
          })
          .then(null, function(err) {
            $scope.processing = false;
            $scope.rootSoundcloudLogin();
          });
      } else {
        $scope.processing = false;
        //if (state) $state.go(state);
        if (location) window.location.href = location;
        else window.location.reload();
      }
    } else if (param == 'admin') {
      var adminUser = JSON.parse($window.localStorage.getItem('adminUser'));
      if (SessionService.getUser()._id != adminUser._id) {
        $window.localStorage.setItem('prevATUser', JSON.stringify(SessionService.getUser()))
        $scope.processing = true;
        return AuthService
          .login(adminUser.loginInfo)
          .then(handleLoginResponse)
          .catch(console.log);

        function handleLoginResponse(res) {
          if (res.status === 200 && res.data.success) {
            var userData = res.data.user;
            userData.isAdmin = true;
            SessionService.create(userData);
            $scope.processing = false;
            $scope.curATUser = SessionService.getUser()
              // if (state) $state.go(state);
            if (location) window.location.href = location;
            else window.location.reload();
          } else console.log("Invalid Email or Password.");
        }
      } else {
        $scope.processing = false;
        // if (state) $state.go(state);
        if (location) window.location.href = location;
        else window.location.reload();
      }
    } else {
      $scope.processing = true;
      return $http.post('/api/login/soundCloudLogin', {
          token: param.soundcloud.token,
          password: 'test'
        })
        .then(function(res) {
          $scope.processing = false;
          SessionService.create(res.data.user);
          $window.localStorage.setItem('prevATUser', JSON.stringify(SessionService.getUser()))
          $scope.curATUser = SessionService.getUser()
          window.location.reload()
        })
        .then(null, function(err) {
          $scope.processing = false;
          $scope.rootSoundcloudLogin();
        });
    }
  }

  $scope.linkedUsersChange = function(authToken) {
    if (authToken) {
      $scope.processing = true;
      $http.post('/api/login/soundCloudLogin', {
          token: authToken,
          password: 'test'
        })
        .then(function(res) {
          $scope.processing = false;
          if (res.data.user) {
            SessionService.create(res.data.user);
            window.location.reload();
          }
        })
        .then(null, function(err) {
          $scope.processing = false;
          $scope.rootSoundcloudLogin();
        });
    }
  }

  $scope.swithUser = function(isadmin) {
    if (isadmin) {
      mainService.logout();
    } else {
      mainService.adminlogout();
    }
  }

  $rootScope.getUserNetwork = $scope.getUserNetwork = function() {
    if ($window.location.pathname.includes('admin/')) {
      console.log($window.location.pathname + " $window.location.pathname");
      var adminUser = JSON.parse($window.localStorage.getItem('adminUser'));
      return $http.get("/api/database/adminUserNetwork/" + adminUser._id)
        .then(function(res) {
          var troubleUser = res.data.find(function(user) {
            return user.error;
          })
          if (troubleUser) {
            $.Zebra_Dialog("Please log back in with <span style='font-weight:bold'>" + troubleUser.soundcloud.username + "</span> to be able to continue to manage <span style='font-weight:bold'>" + troubleUser.soundcloud.username + "</span>. Otherwise, please remove it from your \"accounts\".", {
              'type': 'question',
              'buttons': [{
                caption: 'Cancel',
                callback: function() {}
              }, {
                caption: 'Log In',
                callback: function() {
                  $scope.rootSoundcloudLogin();
                }
              }]
            })
          }
          $rootScope.userlinkedAccounts = res.data;
        })
    } else {
      return $http.get("/api/database/userNetworks")
        .then(function(res) {
          var troubleUser = res.data.find(function(user) {
            return user.error;
          })
          console.log(res.data);
          if (troubleUser) {
            console.log(troubleUser)
            $.Zebra_Dialog("Please log back in with <span style='font-weight:bold'>" + troubleUser.soundcloud.username + "</span> to be able to continue to manage <span style='font-weight:bold'>" + troubleUser.soundcloud.username + "</span>. Otherwise, please remove it from your \"Linked Accounts\".", {
              'type': 'question',
              'buttons': [{
                caption: 'Cancel',
                callback: function() {}
              }, {
                caption: 'Log In',
                callback: function() {
                  $scope.rootSoundcloudLogin();
                }
              }]
            })
          }
          $rootScope.userlinkedAccounts = res.data;
        })
    }
  }
  if ($scope.user && $scope.user.role == "admin") $rootScope.getUserNetwork();
  //    $scope.checkNotification();
});

app.directive('fbLike', [
  '$window', '$rootScope',
  function($window, $rootScope) {
    return {
      restrict: 'A',
      scope: {
        fbLike: '=?'
      },
      link: function(scope, element, attrs) {
        if (!$window.FB) {
          // Load Facebook SDK if not already loaded
          $.getScript('//connect.facebook.net/en_US/sdk.js', function() {
            $window.FB.init({
              appId: $rootScope.facebookAppId,
              xfbml: true,
              version: 'v2.0'
            });
            renderLikeButton();
          });
        } else {
          renderLikeButton();
        }

        var watchAdded = false;

        function renderLikeButton() {
          if (!!attrs.fbLike && !scope.fbLike && !watchAdded) {
            // wait for data if it hasn't loaded yet
            watchAdded = true;
            var unbindWatch = scope.$watch('fbLike', function(newValue, oldValue) {
              if (newValue) {
                renderLikeButton();
                // only need to run once
                unbindWatch();
              }
            });
            return;
          } else {
            element.html('<div class="fb-like"' + (!!scope.fbLike ? ' data-href="' + scope.fbLike + '"' : '') + ' data-layout="button_count" data-action="like" data-show-faces="true" data-share="true"></div>');
            $window.FB.XFBML.parse(element.parent()[0]);
          }
        }
      }
    };
  }
])

app.directive('fileread', [function() {
  return {
    scope: {
      fileread: '=',
      message: '='
    },
    link: function(scope, element, attributes) {
      element.bind('change', function(changeEvent) {
        scope.$apply(function() {
          scope.message = {
            visible: false,
            val: ''
          };
          if (changeEvent.target.files[0].type != "audio/mpeg" && changeEvent.target.files[0].type != "audio/mp3") {
            scope.message = {
              visible: true,
              val: 'Error: Please upload mp3 format file.'
            };
            element.val(null);
            return;
          }
          if (changeEvent.target.files[0].size > 20 * 1000 * 1000) {
            scope.message = {
              visible: true,
              val: 'Error: Please upload file upto 20 MB size.'
            };
            element.val(null);
            return;
          }
          scope.fileread = changeEvent.target.files[0];
        });
      });
    }
  }
}]);

app.service('mainService', function($http, SessionService) {
  this.logout = function() {
    $http.post('/api/logout').then(function() {
      SessionService.deleteUser();
      window.location.href = '/login';
    });
  }
  this.adminlogout = function() {
    $http.post('/api/logout').then(function() {
      SessionService.deleteUser();
      window.localStorage.removeItem('isAdminAuthenticate');
      window.location.href = '/admin';
    });
  }
});

/*Load more*/
app.directive('whenScrolled', function() {
  return function(scope, elm, attr) {
    var raw = elm[0];
    elm.bind('scroll', function() {
      if (raw.scrollTop + raw.offsetHeight >= raw.scrollHeight) {
        scope.$apply(attr.whenScrolled);
      }
    });
  };
});

function getQueryString(field, url) {
  var href = url ? url : window.location.href;
  var reg = new RegExp('[?&]' + field + '=([^&#]*)', 'i');
  var string = reg.exec(href);
  return string ? string[1] : null;
};

function queryStringify(obj) {
  return '?' + Object.keys(obj).reduce(function(a, k) {
    a.push(k + '=' + encodeURIComponent(obj[k]));
    return a
  }, []).join('&')
}

var daysOfWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

function createPseudoAvailableSlots(user) {
  var pseudoSlots = {};
  var tzOffset = (-(new Date()).getTimezoneOffset() - user.astzOffset) / 60;
  daysOfWeek.forEach(function(day) {
    if (user.availableSlots[day]) {
      var daySlots = [];
      user.availableSlots[day].forEach(function(hour) {
        daySlots.push((hour + tzOffset + 24) % 24);
      })
      daySlots.sort(function(a, b) {
        if (a < b) return -1;
        else return 1;
      })
      pseudoSlots[day] = daySlots;
    }
  })
  return pseudoSlots;
}

function createAvailableSlots(user, pseudoSlots) {
  var availableSlots = {};
  var tzOffset = (-(new Date()).getTimezoneOffset() - user.astzOffset) / 60;
  daysOfWeek.forEach(function(day) {
    if (pseudoSlots[day]) {
      var daySlots = [];
      pseudoSlots[day].forEach(function(hour) {
        daySlots.push((hour - tzOffset + 24) % 24);
      })
      daySlots.sort(function(a, b) {
        if (a < b) return -1;
        else return 1;
      })
      availableSlots[day] = daySlots;
    }
  })
  return availableSlots;
}
