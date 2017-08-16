app.config(function($stateProvider) {
  $stateProvider.state('scheduler', {
    url: '/admin/scheduler',
    templateUrl: 'js/scheduler/scheduler.html',
    controller: 'adminSchedulerController',
    resolve: {
      events: function($http, $window, SessionService) {
        if (!SessionService.getUser()) {
          $window.localStorage.setItem('returnstate', 'artistToolsScheduler');
          $window.location.href = '/admin';
        }
        return $http.get('/api/events/forUser/' + SessionService.getUser().soundcloud.id)
          .then(function(res) {
            console.log(res + " admin soundcloud.id");
            return res.data;
          })
          .then(null, function(err) {
            $.Zebra_Dialog("error getting your events");
            return;
          })
      }
    }
  })
});

app.controller('adminSchedulerController', function($rootScope, $state, $scope, $http, AuthService, $window, events, SessionService) {
  if (!SessionService.getUser()) {
    $state.go('login');
  } else {
    $window.localStorage.removeItem('returnstate');
  }
  events.forEach(function(ev) {
    ev.day = new Date(ev.day);
  });
  $scope.curATUser = SessionService.getUser();
  $scope.events = events;
  $scope.isLoggedIn = SessionService.getUser() ? true : false;
});