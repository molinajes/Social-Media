app.config(function($stateProvider) {
  $stateProvider
    .state('artistToolsDownloadGatewayEdit', {
      url: '/artistTools/downloadGateway/edit/:gatewayID',
      templateUrl: 'js/artistTools/downloadGateway/downloadGateway.html',
      controller: 'ArtistToolsDownloadGatewayController',
      resolve: {
        isLoggedIn: function($stateParams, $window, SessionService) {
          if (!SessionService.getUser()) {
            $window.localStorage.setItem('returnstate', 'artistToolsDownloadGatewayEdit');
            $window.localStorage.setItem('tid', $stateParams.gatewayID);
            $window.location.href = '/login';
          }
          return true;
        }
      }
    })
    .state('artistToolsDownloadGatewayNew', {
      url: '/artistTools/downloadGateway/new',
      params: {
        submission: null
      },
      templateUrl: 'js/artistTools/downloadGateway/downloadGateway.html',
      controller: 'ArtistToolsDownloadGatewayController',
      resolve: {
        isLoggedIn: function($stateParams, $window, SessionService) {
          if (!SessionService.getUser()) {
            $window.localStorage.setItem('returnstate', 'artistToolsDownloadGatewayNew');
            $window.location.href = '/login';
          }
          return true;
        }
      }
    })
});

app.controller('ArtistToolsDownloadGatewayController', function($rootScope, $state, $stateParams, $scope, $http, $location, $window, $uibModal, $timeout, SessionService, ArtistToolsService, AdminDLGateService) {
  /* Init Download Gateway form data */
  $scope.user = SessionService.getUser();
  if (!SessionService.getUser()) {
    $state.go('login');
  } else {
    $window.localStorage.removeItem('returnstate');
    $window.localStorage.removeItem('tid');
  }
  $scope.curATUser = SessionService.getUser();
});