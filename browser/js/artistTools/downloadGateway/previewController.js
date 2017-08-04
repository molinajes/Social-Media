app.config(function($stateProvider) {
  $stateProvider
    .state('artistToolsDownloadGatewayPreview', {
      url: '/artistTools/downloadGateway/preview',
      params: {
        submission: null
      },
      templateUrl: 'js/artistTools/downloadGateway/preview.html',
      controller: 'ArtistToolsPreviewController'
    })
});

app.controller("ArtistToolsPreviewController", function($rootScope, $state, $stateParams, $scope, $http, $location, $window, $uibModal, $timeout, SessionService, ArtistToolsService, DownloadTrackService) {});