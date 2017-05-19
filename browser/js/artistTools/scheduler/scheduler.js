app.config(function($stateProvider) {
  $stateProvider.state('artistToolsScheduler', {
    url: '/artistTools/scheduler',
    templateUrl: 'js/artistTools/scheduler/scheduler.html',
    controller: 'ATSchedulerController',
    resolve: {
      events: function($http, $window, SessionService) {
        if (!SessionService.getUser()) {
          $window.localStorage.setItem('returnstate', 'artistToolsScheduler');
          $window.location.href = '/login';
        }
        return $http.get('/api/events/forUser/' + SessionService.getUser().soundcloud.id)
          .then(function(res) {
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

app.controller('ATSchedulerController', function($rootScope, $state, $scope, $http, AuthService, $window, events, SessionService) {
  if (!SessionService.getUser()) {
    $state.go('login');
  } else {
    $window.localStorage.removeItem('returnstate');
  }
  events.forEach(function(ev) {
    ev.day = new Date(ev.day);
  });
  $scope.events = events;
});