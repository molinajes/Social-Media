app.config(function($stateProvider) {
  $stateProvider.state('submitSong', {
    url: '/submit',
    templateUrl: 'js/poolSubmit/submit.view.html',
    controller: 'SubmitSongController'
  });
  $stateProvider.state('customsubmits', {
    url: '/custom/:username/:submitpart',
    templateUrl: 'js/accountSubmit/accountsubmit.view.html',
    controller: 'SubmitSongController',
    resolve: {
      getUserByURL: function($stateParams, $http, $window) {
        var username = $stateParams.username;
        var submitpart = $stateParams.submitpart;
        if (submitpart.indexOf('submit') != -1) {
          $window.location.href = '/' + username + '/submit';
        } else {
          $window.location.href = '/' + username + '/premiere';
        }
        return new Promise(function(fulfill, reject) {});
      }
    }
  });
});

app.controller('SubmitSongController', function(SessionService, $rootScope, $state, $scope, $http, $location) {

  $scope.user = SessionService.getUser();
  $scope.showSignup = true;
  $scope.submission = {};
  $scope.userID = $location.search().id;
  $scope.searchString = "";

  $scope.showPlayer = false;
  
  $scope.choseTrack = function(track) {
    console.log(track.permalink_url);
    if (track.user.permalink_url!="http://soundcloud.com/tropisnetwork") 
    {
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
  }
  $scope.submit = function() {
    if (!$scope.submission.email || !$scope.submission.name || !$scope.submission.trackID) {
      $.Zebra_Dialog("Please fill in all fields")
    } else {
      $scope.processing = true;
      $http.post('/api/submissions/pool', {
          email: $scope.submission.email,
          trackID: $scope.submission.trackID,
          name: $scope.submission.name,
          title: $scope.submission.title,
          trackURL: $scope.submission.trackURL,
          trackArtist: $scope.submission.trackArtist,
          trackArtistURL: $scope.submission.trackArtistURL,
          artworkURL: $scope.submission.artworkURL,
          channelIDS: [],
          genre: ''
        })
        .then(function(res) {
          $.Zebra_Dialog("Your song has been submitted and will be reviewed soon.");
          $scope.processing = false;
          $scope.notFound = false;
          $scope.showPlayer = false;
          $scope.submission = {};
          $scope.searchString = "";
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