app.config(function($stateProvider) {
  $stateProvider
    .state('adminreForReInteraction', {
      url: '/admin/trade/:user1Name/:user2Name',
      templateUrl: 'js/repostTraders/_reForReInteraction.html',
      controller: 'AdminReForReInteractionController',
      resolve: {
        login: function($rootScope, $http, $stateParams, $window, SessionService, $state) {
          if (SessionService.getUser()) {
            return $rootScope.getUserNetwork()
              .then(function() {
                var repName = !!SessionService.getUser().soundcloud ? SessionService.getUser().soundcloud.pseudoname : "";
                if (repName == $stateParams.user1Name || repName == $stateParams.user2Name) {
                  return 'ok'
                } else {
                  var found = $rootScope.userlinkedAccounts.find(function(user) {
                    var repName = user.soundcloud.pseudoname;
                    return (repName == $stateParams.user1Name || repName == $stateParams.user2Name)
                  })
                  if (found) {
                    $rootScope.changeUserAdmin(found)
                  } else {
                    if ($window.localStorage.getItem('returnstate') == 'reForReInteraction') {
                      $window.localStorage.removeItem('returnstate');
                      $window.localStorage.removeItem('user1Name');
                      $window.localStorage.removeItem('user2Name');
                      $state.go('scheduler');
                    } else {
                      $window.localStorage.setItem('returnstate', 'reForReInteraction');
                      $window.localStorage.setItem('user1Name', $stateParams.user1Name);
                      $window.localStorage.setItem('user2Name', $stateParams.user2Name);
                      SessionService.deleteUser();
                      window.location.href = '/login';
                    }
                  }
                }
              });
          } else {
            $window.localStorage.setItem('returnstate', 'reForReInteraction');
            $window.localStorage.setItem('user1Name', $stateParams.user1Name);
            $window.localStorage.setItem('user2Name', $stateParams.user2Name);
            SessionService.deleteUser();
            window.location.href = '/login';
          }
        },
        trade: function($rootScope, $http, $stateParams, $window, SessionService) {
          return $http.get('/api/trades/withUsers/' + $stateParams.user1Name + '/' + $stateParams.user2Name)
            .then(function(res) {
              var user = SessionService.getUser('subAdmin');
              var trade = res.data;
              trade.p1.user.pseudoAvailableSlots = createPseudoAvailableSlots(trade.p1.user);
              trade.p2.user.pseudoAvailableSlots = createPseudoAvailableSlots(trade.p2.user);
              trade.other = (trade.p1.user._id == user._id) ? trade.p2 : trade.p1;
              trade.user = (trade.p1.user._id == user._id) ? trade.p1 : trade.p2;
              return trade;
            }).then(null, console.log)
        },
        events: function($http, $window, SessionService) {
          return $http.get('/api/events/forUser/' + SessionService.getUser().soundcloud.id)
            .then(function(res) {
              return res.data;
            })
            .then(null, function(err) {
              $.Zebra_Dialog("error getting your events");
              return;
            })
        },
        p1Events: function($http, trade) {
          return $http.get('/api/events/forUser/' + trade.p1.user.soundcloud.id)
            .then(function(res) {
              return res.data;
            })
            .then(null, function(err) {
              $.Zebra_Dialog("error getting your events");
              return;
            })
        },
        p2Events: function($http, trade) {
          return $http.get('/api/events/forUser/' + trade.p2.user.soundcloud.id)
            .then(function(res) {
              return res.data;
            })
            .then(null, function(err) {
              $.Zebra_Dialog("error getting other's events events");
              return;
            })
        },
        // currentTrades: function($http, SessionService) {
        //   var tradeType = {
        //     Requests: true,
        //     Requested: true,
        //     TradePartners: true
        //   };
        //   var user = SessionService.getUser();
        //   return $http.get('/api/trades/withUser/' + user._id + '?tradeType=' + JSON.stringify(tradeType))
        //     .then(function(res) {
        //       var trades = res.data;
        //       trades.forEach(function(trade) {
        //         trade.p1.user.pseudoAvailableSlots = createPseudoAvailableSlots(trade.p1.user);
        //         trade.p2.user.pseudoAvailableSlots = createPseudoAvailableSlots(trade.p2.user);
        //         trade.other = (trade.p1.user._id == user._id) ? trade.p2 : trade.p1;
        //         trade.user = (trade.p1.user._id == user._id) ? trade.p1 : trade.p2;
        //       });
        //       trades.sort(function(a, b) {
        //         if (a.user.alert == "change") {
        //           return -1;
        //         } else if (a.user.alert == "placement") {
        //           return -1
        //         } else {
        //           return 1;
        //         }
        //       })
        //       return trades;
        //     })
        // }
      }
    })
});

app.controller("AdminReForReInteractionController", function($rootScope, $state, $scope, $http, AuthService, $window, SessionService, socket, $stateParams, trade, p1Events, p2Events) {
  console.log("adminreForReInteraction");
  $scope.user = SessionService.getUser();
  if (!SessionService.getUser()) {
    $state.go('login');
  } else {
    $window.localStorage.removeItem('returnstate');
    $window.localStorage.removeItem('user1ID');
    $window.localStorage.removeItem('user2ID');
  }
  $scope.isLoggedIn = SessionService.getUser() ? true : false;
  $scope.trade = trade;
  $scope.msgHistory = trade.messages;
  // $scope.currentTrades = currentTrades;
  $scope.p1Events = p1Events;
  $scope.p2Events = p2Events;
  $scope.stateParams = $stateParams;
});