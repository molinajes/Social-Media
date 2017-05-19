app.config(function($stateProvider) {
  $stateProvider.state('mixingMastering', {
    url: '/mixingMastering',
    templateUrl: 'js/mixingMastering/mixingMastering.html',
    controller: 'mixingMasteringController'
  });
});

app.controller('mixingMasteringController', function($rootScope, $state, $scope, $http, MixingMasteringService) {
  $scope.mixingMastering = {};
  $scope.processing = false;
  $scope.saveMixingMastering = function() {
    if (!$scope.mixingMastering.file || !$scope.mixingMastering.email || !$scope.mixingMastering.name || !$scope.mixingMastering.comment) {
      $.Zebra_Dialog("Please fill in all fields")
    } 
    else 
    {
      $scope.processing = true;
      $scope.message.visible = false;
      var data = new FormData();
      for (var prop in $scope.mixingMastering) {
        data.append(prop, $scope.mixingMastering[prop]);
      }

      MixingMasteringService
      .saveMixingMastering(data)
      .then(receiveResponse)
      .catch(catchError);

      function receiveResponse(res) {
        $scope.processing = false;
        if (res.status === 200) {
          $scope.mixingMastering = {};
          angular.element("input[type='file']").val(null);
          $.Zebra_Dialog("Thank you! Your request has been submitted successfully.");
          return;
        }
        $.Zebra_Dialog("Error in processing the request. Please try again.");
      }

      function catchError(res) {
        $scope.processing = false;
        $.Zebra_Dialog("Error in processing the request. Please try again.");
      }
    }
  }
});