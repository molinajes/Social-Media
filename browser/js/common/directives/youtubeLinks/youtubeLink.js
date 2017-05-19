app.directive('youtubeModal', function ($http) {
  return {
    templateUrl: 'js/common/directives/youtubeLinks/youtubeLink.html',
    restrict: 'EA',
    scope: {
      title: '=modalTitle',
      header: '=modalHeader',
      body: '=modalBody',
      footer: '=modalFooter',
      handler: '=youTube'
    },
    transclude: true,
    controller: function ($scope) {
      $scope.handler = 'ytube';
      $scope.origin = window.location.origin;
      if(window.location.pathname.indexOf('scheduler') >-1)
      { 
        $scope.youtubeUrl = "https://www.youtube.com/embed/vUCM_0evdQY";
      }
      else if(window.location.pathname.indexOf('reposttraders') >-1 || window.location.pathname.indexOf('reForReLists') >-1)
      {
        $scope.youtubeUrl = "https://www.youtube.com/embed/LA_HEUM_xqc";
      }
      else if(window.location.pathname.indexOf('admin/submission') >-1)
      {
        $scope.youtubeUrl = "https://www.youtube.com/embed/vUCM_0evdQY";
      }
      else if(window.location.pathname.indexOf('downloadGateway') >-1)
      {
        $scope.youtubeUrl = "https://www.youtube.com/embed/vUCM_0evdQY";
      }
      else if(window.location.pathname.indexOf('reForReInteraction') >-1)
      {
        $scope.youtubeUrl = "https://www.youtube.com/embed/vUCM_0evdQY";
      }
      else if(window.location.pathname.indexOf('admin/premiersubmissions') >-1)
      {
        $scope.youtubeUrl = "https://www.youtube.com/embed/vUCM_0evdQY";
      }       
    },
  };
});
app.filter('trusted', ['$sce', function($sce) {
  return function(url) {
    return $sce.trustAsResourceUrl(url);
  };
}]);
