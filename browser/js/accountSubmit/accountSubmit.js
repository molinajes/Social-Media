app.config(function($stateProvider) {
  $stateProvider.state('customsubmit', {
    url: '/:username/submit',
    templateUrl: 'js/accountSubmit/accountsubmit.view.html',
    controller: 'AccountSubmitSongController',
    resolve: {
      userID: function($stateParams, $http, $window) {
        var username = $stateParams.username;
        return $http.get('/api/users/getUserByURL/' + username + '/submit')
          .then(function(res) {
            return {
              userid: res.data,
              username: username,
              submitpart: 'submit'
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

app.controller('AccountSubmitSongController', function($rootScope, $state, $scope, userID, customizeSettings, $http, customizeService, $location) {
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

  $scope.submission = {
    genre: "genre"
  };
  $scope.customizeSettings = customizeSettings;
  $scope.searchString = "";
  $scope.showPlayer = false;
  console.log(window.localStorage.getItem('hasBeenAdmin'));
  $scope.choseTrack = function(track) {
    console.log(track);
    $scope.searchString = track.title;
    $scope.submission.trackID = track.id;
    $scope.submission.title = track.title;
    $scope.submission.trackURL = track.permalink_url;
    if (track.user) {
      $scope.submission.trackArtist = track.user.username;
      $scope.submission.trackArtistURL = track.user.permalink_url;
    }
    $scope.submission.artworkURL = track.artwork_url;
    var widget = SC.Widget('scPlayerCustom');
    widget.load($scope.submission.trackURL, {
      auto_play: false,
      show_artwork: true,
      callback: function() {
        if ($scope.submission.title == "--unknown--") {
          widget.getCurrentSound(function(track) {
            console.log(track);
            $scope.searchString = track.title;
            $scope.submission.trackID = track.id;
            $scope.submission.title = track.title;
            $scope.submission.trackURL = track.permalink_url;
            $scope.submission.trackArtist = track.user.username;
            $scope.submission.trackArtistURL = track.user.permalink_url;
            $scope.submission.artworkURL = track.artwork_url;
          })
        }
      }
    });
    $scope.showPlayer = true;
    document.getElementById('scPlayerCustom').style.visibility = "visible";
  }

  $scope.submit = function() {
    if (!$scope.submission.email || !$scope.submission.name || !$scope.submission.trackID || $scope.submission.genre == "genre") {
      $.Zebra_Dialog("Please fill in all fields")
    } else {
      $scope.processing = true;
      $http.post('/api/submissions', {
          email: $scope.submission.email,
          trackID: $scope.submission.trackID,
          name: $scope.submission.name,
          title: $scope.submission.title,
          trackURL: $scope.submission.trackURL,
          trackArtist: $scope.submission.trackArtist,
          trackArtistURL: $scope.submission.trackArtistURL,
          artworkURL: $scope.submission.artworkURL,
          channelIDS: [],
          invoiceIDS: [],
          userID: userID.userid,
          genre: $scope.submission.genre
        })
        .then(function(res) {
          $.Zebra_Dialog("Your song has been submitted and will be reviewed soon.");
          $scope.processing = false;
          $scope.notFound = false;
          $scope.submission = {
            genre: "genre"
          };
          $scope.searchString = "";
          $scope.showPlayer = false;
          document.getElementById('scPlayerCustom').style.visibility = "hidden";
          $scope.url = "";
        })
        .then(null, function(err) {
          $scope.processing = false;
          $.Zebra_Dialog(err.data);
        });
    }
  }
});
