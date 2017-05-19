app.config(function($stateProvider) {
  $stateProvider.state('custompremier', {
    url: '/:username/premiere',
    templateUrl: 'js/accountPremiere/accountPremier.view.html',
    controller: 'AccountPremierController',
    resolve: {
      userID: function($stateParams, $http, $window) {
        var username = $stateParams.username;
        return $http.get('/api/users/getUserByURL/' + username + '/premiere')
          .then(function(res) {
            return {
              userid: res.data,
              username: username,
              submitpart: 'premiere'
            };
          })
          .then(null, function(err) {
            $.Zebra_Dialog("error getting your events");
            return;
          })
      },
      customizeSettings: function($http, customizeService, userID) {
        if (userID.userid == "nouser") {
          $location.path("/" + userID.username + "/" + userID.submitpart);
        }
        return customizeService.getCustomPageSettings(userID.userid, userID.submitpart)
          .then(function(response) {
            return response;
          })
          .then(null, function(err) {
            $.Zebra_Dialog("error getting your customize settings");
            return;
          })
      }
    }
  });
});

app.controller('AccountPremierController', function($rootScope, $state, $scope, userID, customizeSettings, $http, customizeService, $location, PremierService) {
  $scope.premierObj = {};
  $scope.customizeSettings = customizeSettings;
  $scope.message = {
    val: '',
    visible: false
  };
  $scope.processing = false;
  $scope.savePremier = function() {
    if (!$scope.premierObj.trackLink && !$scope.premierObj.file) {
      $.Zebra_Dialog("Please upload an mp3 file of provide a link.");
    } else {
      $http.post('/api/soundcloud/resolve', {
        url: $scope.premierObj.trackLink
      }).then(function(res) {
        $.Zebra_Dialog('We can not premiere this track because you have already released it. Please submit the track for repost instead!', {
          'buttons': [{
            caption: 'Close',
            callback: function() {}
          }, {
            caption: 'Submit for Repost',
            callback: function() {
              window.location.href = window.location.origin + "/" + userID.username + "/submit";
            }
          }]
        })
      }).then(null, function(err) {
        $scope.processing = true;
        $scope.message.visible = false;
        var data = new FormData();
        for (var prop in $scope.premierObj) {
          data.append(prop, $scope.premierObj[prop]);
        }
        data.append("userID", userID.userid);
        PremierService
          .savePremier(data)
          .then(receiveResponse)
          .catch(catchError);

        function receiveResponse(res) {
          $scope.processing = false;
          if (res.status === 200) {
            $scope.premierObj = {};
            angular.element("input[type='file']").val(null);
            $.Zebra_Dialog('Thank you! Your message has been sent successfully.')
          } else {
            $.Zebra_Dialog('Error processing. Please try again.')
          }
        }

        function catchError(res) {
          $scope.processing = false;
          $.Zebra_Dialog('Error processing. Please try again.')
        }
      })
    };
  };
});