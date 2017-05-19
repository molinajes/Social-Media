app.config(function($stateProvider) {
  $stateProvider.state('customizesubmission', {
    url: '/admin/customizesubmission',
    templateUrl: 'js/customizeSubmission/views/customizeSubmission.html',
    controller: 'CustomizeSubmissionController'
  })
});

app.controller('CustomizeSubmissionController', function($rootScope, $state, $scope, $http, AuthService, SessionService, $sce, customizeService) {
  if (!SessionService.getUser()) {
    $state.go('admin');
  }
  $scope.user = SessionService.getUser();
  $scope.submission = {};
  $scope.genreArray = [
    'Alternative Rock',
    'Ambient',
    'Creative',
    'Chill',
    'Classical',
    'Country',
    'Dance & EDM',
    'Dancehall',
    'Deep House',
    'Disco',
    'Drum & Bass',
    'Dubstep',
    'Electronic',
    'Festival',
    'Folk',
    'Hip-Hop/RNB',
    'House',
    'Indie/Alternative',
    'Latin',
    'Trap',
    'Vocalists/Singer-Songwriter'
  ];

  $scope.saveSettings = function() {
    $scope.processing = true;
    //customizeService.uploadFile($scope.backImage.file).then(function(res){
    //var backImage=res.Location;
    //$scope.postData.backgroundimage=backImage;
    $scope.postData.userID = $scope.user._id;
    var subHeadingText = ($scope.postData.subHeading.text ? $scope.postData.subHeading.text.replace(/\r?\n/g, '<br />') : '');
    $scope.postData.subHeading.text = subHeadingText;
    customizeService.addCustomize($scope.postData)
      .then(function(response) {
        $scope.processing = false;
      }).catch(function(error) {
        console.log("er", error);
      });
    //}) 
  }

  $scope.getCustomizeSettings = function() {
    customizeService.getCustomPageSettings($scope.user._id)
      .then(function(response) {
        if (response) {
          $scope.postData = response;
          $scope.customizeSettings = response;
        } else {
          $scope.postData = {
            heading: {
              text: "Submission for Promotion",
              style: {
                fontSize: 21,
                fontColor: '#999',
                fontWeight: 'Bold'
              }
            },
            subHeading: {
              text: "Our mission is to simply bring the best music to the people. We also have a strong commitment to providing feedback and guidance for rising artists. We guarantee that your song will be listened to and critiqued by our dedicated staff if it passes our submission process. Although we cannot guarantee support for your submission on our promotional platforms such as SoundCloud, YouTube, and Facebook, we will make sure to get back to you with a response.",
              style: {
                fontSize: 16,
                fontColor: '#7d5a5a',
                fontWeight: 'Normal'
              }
            },
            inputFields: {
              style: {
                border: 1,
                borderRadius: 4,
                borderColor: '#F5D3B5',
              }
            },
            button: {
              text: 'Enter',
              style: {
                fontSize: 15,
                fontColor: '#fff',
                border: 1,
                borderRadius: 4,
                bgColor: '#F5BBBC'
              }
            }
          };
        }
      });
  }
});
