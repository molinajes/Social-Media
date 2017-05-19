app.config(function($stateProvider) {
  $stateProvider
    .state('adminRepostTraders', {
      url: '/admin/reposttraders',
      templateUrl: 'js/repostTraders/repostTraders.html',
      controller: 'adminReForReListsController',
      resolve: {
        currentTrades: function($http, SessionService) {
          var user = SessionService.getUser();
          if (user) {
            return $http.get('/api/trades/withUser/' + user._id)
              .then(function(res) {
                var trades = res.data;
                trades = trades.filter(function(trade) {
                  return (!!trade.p1.user && !!trade.p2.user)
                })
                trades.forEach(function(trade) {
                  trade.other = (trade.p1.user._id == user._id) ? trade.p2 : trade.p1;
                  trade.user = (trade.p1.user._id == user._id) ? trade.p1 : trade.p2;
                });
                return trades;
              })
          } else {
            return [];
          }
        },
        favorites: function($http, SessionService) {
          var user = SessionService.getUser();
          if (user) {
            return $http.get('/api/trades/doneWithUser/' + user._id)
              .then(function(res) {
                var trades = res.data;
                trades = trades.filter(function(trade) {
                  return (!!trade.p1.user && !!trade.p2.user)
                })
                var favs = trades.map(function(trade) {
                  return ((trade.p1.user._id == user._id) ? trade.p2.user : trade.p1.user)
                });
                // favs = favs.filter(function(favUser) {
                //     var ok = true;
                //     currentTrades.forEach(function(trade) {
                //       if (trade.p1.user._id == favUser._id || trade.p2.user._id == favUser._id) {
                //         ok = false;
                //       }
                //     })
                //     return ok;
                //   })
                var favsNoDups = [];
                favs.forEach(function(favUser) {
                  var ok = true;
                  favsNoDups.forEach(function(noDupUser) {
                    if (favUser._id == noDupUser._id) ok = false;
                  })
                  if (ok) favsNoDups.push(favUser);
                })
                return favsNoDups;
              }).then(null, console.log);
          } else {
            return [];
          }
        },
        openTrades: function($http, SessionService) {
          var user = SessionService.getUser();
          if (user) {
            var minFollower = ((user.soundcloud.followers && user.soundcloud.followers > 0) ? parseInt(user.soundcloud.followers / 2) : 0);
            var maxFollower = ((user.soundcloud.followers && user.soundcloud.followers > 0) ? parseInt(user.soundcloud.followers * 2) : 1000);
            return $http.post('/api/users/bySCURL/', {
                url: '',
                minFollower: minFollower,
                maxFollower: maxFollower,
                recordRange: {
                  skip: 0,
                  limit: 12
                }
              })
              .then(function(res) {
                var users = res.data;
                return users;
              }).then(null, console.log);
          } else {
            return [];
          }
        },
        repostEvents: function($http, SessionService) {
          var user = SessionService.getUser();
          if (user) {
            return $http.get("/api/events/getRepostEvents/" + user._id)
              .then(function(repostEvent) {
                var repostEvent = repostEvent.data;
                return repostEvent;
              });
          } else {
            return [];
          }
        }
      }
    });
});

app.controller("adminReForReListsController", function($scope, $rootScope, currentTrades, favorites, openTrades, repostEvents, $http, SessionService, $state, $timeout, $window) {
  if (!SessionService.getUser()) {
    $state.go('login');
    return;
  }
  $scope.curATUser = SessionService.getUser();
  $scope.isLoggedIn = SessionService.getUser() ? true : false;
  $scope.listevents = repostEvents;
  $scope.currentTrades = currentTrades;
  $scope.currentTradesCopy = currentTrades;
  $scope.favorites = favorites;
  $scope.searchUser = openTrades;
  repostEvents.forEach(function(ev) {
    ev.day = new Date(ev.day);
  });
  $scope.events = repostEvents;
});