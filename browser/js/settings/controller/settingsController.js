app.config(function($stateProvider) {
  $stateProvider.state('settings', {
    url: '/admin/settings',
    templateUrl: 'js/settings/views/settings.html',
    controller: 'settingsController'
  })
});

app.controller('settingsController', function($rootScope, $state, $scope, $http, SettingService, SessionService) {
  if (!SessionService.getUser()) {
    $state.go('admin');
  }

  $scope.user = SessionService.getUser();
  $scope.profile = SessionService.getUser();  
  $scope.updateProfileWithPicture = function(data) {
    $scope.processing = true;
    if(typeof $scope.profilepic === 'undefined')
    {
      saveToDb(null, $scope.profile.profilePicture);
    }
    else
    {
      SettingService.uploadFile($scope.profilepic.file).then(function(res) {
        if (res.success) {
          saveToDb(res, res.data.Location);
        }
      });
    }

    function saveToDb(res,url)
    {
      SettingService
        .updateAdminProfile({
          username: data.name,
          pictureUrl: url
        })
        .then(function(res) {
          SessionService.create(res.data);
          $scope.user = SessionService.getUser();
          $scope.processing = false;
          $.Zebra_Dialog('Profile updated Successfully');
        })
      .catch(function() {
      });
    }
  }

  $scope.updatePassword = function(data) {
    if (data.newPassword != data.confirmPassword) {
      $.Zebra_Dialog('Password doesn\'t match with confirm password');
      return;
    } 
    else {
      $scope.processing = true;
      SettingService
        .updateAdminProfile({
          password: data.newPassword,
        }).then(function(res) {
          $scope.processing = false;
          $.Zebra_Dialog('Password changed successfully.');
      }).catch(function() {
      });
    }
  }
});