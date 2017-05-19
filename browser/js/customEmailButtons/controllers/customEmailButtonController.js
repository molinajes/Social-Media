app.config(function($stateProvider) {
  $stateProvider.state('customemailbuttons', {
    url: '/admin/customemailbuttons',
    templateUrl: 'js/customEmailButtons/views/customEmailButtons.html',
    controller: 'CustomEmailButtonController'
  })
});

app.controller('CustomEmailButtonController', function($rootScope, $state, $scope, $http, AuthService, SessionService,$sce,customizeService) {
  if (!SessionService.getUser()) {
    $state.go('admin');
  }
  $scope.user = SessionService.getUser();
  $scope.customEmailButtons = $scope.user.customEmailButtons ? $scope.user.customEmailButtons : [];
  if($scope.customEmailButtons.length == 0){
    $scope.customEmailButtons.push({
      toEmail: '',
      subject: '',
      emailBody: '',
      buttonText: '',
      buttonBgColor: ''
    });
  }
  $scope.saveSettings=function(){
    var valid = true;
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    angular.forEach($scope.customEmailButtons, function(cb) {
      if(cb.toEmail != "{email}"){
        var validEmail = re.test(cb.toEmail);
        if (!validEmail) {
          valid = false;
        }
      }
    });
    if(!valid){
      $.Zebra_Dialog('Please enter {email} or a well formatted email id in Tom Email field.');
      return;
    }
    $scope.processing = true;
    $scope.user.customEmailButtons = $scope.customEmailButtons;
    $http.post('/api/database/updateCustomEmailButtons', {
      customEmailButtons: $scope.user.customEmailButtons,
    }).then(function(res) {
      $scope.processing = false;
      SessionService.create(res.data);
      $scope.user = SessionService.getUser();
    });
  }

  $scope.addItem = function() {
    $scope.customEmailButtons.push({
      toEmail: '',
      subject: '',
      emailBody: '',
      buttonText: '',
      buttonBgColor: ''
    });
  }

  $scope.removeItem = function(index) {
    $scope.customEmailButtons.splice(index, 1);
  }
});