app.config(function($stateProvider) {
  $stateProvider.state('complete', {
    url: '/complete',
    templateUrl: 'js/pay/thankyou.html',
    controller: 'ThankyouController'
  });
});

app.controller('ThankyouController', function($http, $scope, $location) {
  $scope.processing = true;
  $scope.notified = false;
  $http.put('/api/submissions/completedPayment', $location.search())
    .then(function(res) {
      console.log(res.data);
      $scope.processing = false;
      window.location.href = res.data.link;
    })
    .then(null, function(err) {
      $scope.processing = false;
      $.Zebra_Dialog(err.data);
    })
});