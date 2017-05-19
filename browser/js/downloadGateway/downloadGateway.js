app.config(function($stateProvider) {
  $stateProvider
    .state('adminDownloadGateway', {
      url: '/admin/downloadGateway',
      templateUrl: 'js/downloadGateway/downloadGateway.list.html',
      controller: 'AdminDownloadGatewayController',
      resolve: {
        isLoggedIn: function($stateParams, $window, SessionService) {
          if (!SessionService.getUser()) {
            $window.localStorage.setItem('returnstate', 'adminDownloadGateway');
            $window.localStorage.setItem('tid', $stateParams.gatewayID);
            $window.location.href = '/admin';
          }
          return true;
        },
      }
    })
    .state('adminDownloadGatewayEdit', {
      url: '/admin/downloadGateway/edit/:gatewayID',
      templateUrl: 'js/downloadGateway/downloadGateway.html',
      controller: 'AdminDownloadGatewayController',
      resolve: {
        isLoggedIn: function($stateParams, $window, SessionService) {
          if (!SessionService.getUser()) {
            $window.localStorage.setItem('returnstate', 'adminDownloadGatewayEdit');
            $window.localStorage.setItem('tid', $stateParams.gatewayID);
            $window.location.href = '/admin';
          }
          return true;
        },
      }
    })
    .state('adminDownloadGatewayNew', {
      url: '/admin/downloadGateway/new',
      params: {
        submission: null
      },
      templateUrl: 'js/downloadGateway/downloadGateway.html',
      controller: 'AdminDownloadGatewayController',
      resolve: {
        isLoggedIn: function($stateParams, $window, SessionService) {
          if (!SessionService.getUser()) {
            $window.localStorage.setItem('returnstate', 'adminDownloadGatewayNew');
            $window.location.href = '/admin';
          }
          return true;
        },
      }
    })
    .state('adminDownloadGatewayPreview', {
      url: '/admin/downloadGateway/preview',
      params: {
        submission: null
      },
      templateUrl: 'js/downloadGateway/preview.html',
      controller: 'AdminDownloadGatewayController',
    })
});

app.controller('AdminDownloadGatewayController', function($rootScope, $state, $stateParams, $scope, $http, $location, $window, $uibModal, $timeout, SessionService, AdminToolsService, AdminDLGateService, DownloadTrackService) {
  // /* Init Download Gateway form data */
  $scope.isLoggedIn = SessionService.getUser() ? true : false;
  $scope.curATUser = SessionService.getUser();
});