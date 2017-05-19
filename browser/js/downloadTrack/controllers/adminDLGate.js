app.config(function($stateProvider) {
  $stateProvider.state('downloadGate', {
    url: '/admin/downloadGate',
    templateUrl: 'js/downloadTrack/views/adminDLGate.html',
    controller: 'AdminDLGateController'
  });
});

app.config(function($stateProvider) {
  $stateProvider.state('downloadGateList', {
    url: '/admin/downloadGate/list',
    templateUrl: 'js/downloadTrack/views/adminDLGate.list.html',
    controller: 'AdminDLGateController'
  });
});

app.config(function($stateProvider) {
  $stateProvider.state('downloadGateEdit', {
    url: '/admin/downloadGate/edit/:gatewayID',
    templateUrl: 'js/downloadTrack/views/adminDLGate.html',
    controller: 'AdminDLGateController'
  });
});


app.controller('AdminDLGateController', ['$rootScope',
  '$state',
  '$stateParams',
  '$scope',
  '$http',
  '$location',
  '$window',
  '$uibModal',
  'SessionService',
  'AdminDLGateService',
  function($rootScope, $state, $stateParams, $scope, $http, $location, $window, $uibModal, SessionService, AdminDLGateService) {
    if (!SessionService.getUser()) {
      $state.go('admin');
    }
    /* Init boolean variables for show/hide and other functionalities */
    $scope.processing = false;
    $scope.isTrackAvailable = false;
    $scope.message = {
      val: '',
      visible: false
    };

    /* Init Download Gateway form data */

    $scope.track = {
      artistUsername: 'La Tropicál',
      trackTitle: 'Panteone / Travel',
      trackArtworkURL: 'assets/images/who-we-are.png',
      SMLinks: [],
      like: false,
      comment: false,
      repost: false,
      artists: [{
        url: '',
        avatar: 'assets/images/who-we-are.png',
        username: '',
        id: -1,
        permanentLink: false
      }],
      playlists: [{
        url: '',
        avatar: '',
        title: '',
        id: ''
      }]
    };

    /* Init downloadGateway list */

    $scope.downloadGatewayList = [];

    /* Init modal instance variables and methods */

    $scope.modalInstance = {};
    $scope.modal = {};
    $scope.openModal = {
      downloadURL: function(downloadURL) {
        $scope.modal.downloadURL = downloadURL;
        $scope.modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'downloadURL.html',
          controller: 'ArtistToolsController',
          scope: $scope
        });
      }
    };
    $scope.closeModal = function() {
      $scope.modalInstance.close();
    }

    /* Init profile */
    $scope.profile = {};

    /* Method for resetting Download Gateway form */

    function resetDownloadGateway() {
      $scope.processing = false;
      $scope.isTrackAvailable = false;
      $scope.message = {
        val: '',
        visible: false
      };

      $scope.track = {
        artistUsername: 'La Tropicál',
        trackTitle: 'Panteone / Travel',
        trackArtworkURL: 'assets/images/who-we-are.png',
        SMLinks: [],
        like: false,
        comment: false,
        repost: false,
        artists: [{
          url: '',
          avatar: 'assets/images/who-we-are.png',
          username: '',
          id: -1,
          permanentLink: false
        }],
        playlists: [{
          url: '',
          avatar: '',
          title: '',
          id: ''
        }]
      };
      angular.element("input[type='file']").val(null);
    }

    /* Check if stateParams has gatewayID to initiate edit */
    $scope.checkIfEdit = function() {
      if ($stateParams.gatewayID) {
        $scope.getDownloadGateway($stateParams.gatewayID);
        // if(!$stateParams.downloadGateway) {
        //   $scope.getDownloadGateway($stateParams.gatewayID);
        // } else {
        //   $scope.track = $stateParams.downloadGateway;
        // }
      }
    }

    $scope.trackURLChange = function() {
      if ($scope.track.trackURL !== '') {
        $scope.isTrackAvailable = false;
        $scope.processing = true;
        AdminDLGateService
          .resolveData({
            url: $scope.track.trackURL
          })
          .then(handleTrackDataAndGetProfiles)
          .then(handleWebProfiles)
          .catch(handleError);

        function handleTrackDataAndGetProfiles(res) {
          $scope.track.trackTitle = res.data.title;
          $scope.track.trackID = res.data.id;
          $scope.track.artistID = res.data.user.id;
          $scope.track.trackArtworkURL = res.data.artwork_url ? res.data.artwork_url.replace('large.jpg', 't500x500.jpg') : '';
          $scope.track.artistArtworkURL = res.data.user.avatar_url ? res.data.user.avatar_url : '';
          $scope.track.artistURL = res.data.user.permalink_url;
          $scope.track.artistUsername = res.data.user.username;
          $scope.track.SMLinks = [];
          return SC.get('/users/' + $scope.track.artistID + '/web-profiles');
        }

        function handleWebProfiles(profiles) {
          profiles.forEach(function(prof) {
            if (['twitter', 'youtube', 'facebook', 'spotify', 'soundcloud', 'instagram'].indexOf(prof.service) != -1) {
              $scope.track.SMLinks.push({
                key: prof.service,
                value: prof.url
              });
            }
          });
          $scope.isTrackAvailable = true;
          $scope.processing = false;
        }

        function handleError(err) {
          $scope.track.trackID = null;
          $.Zebra_Dialog('Song not found or forbidden');
          $scope.processing = false;
        }
      }
    };

    $scope.artistURLChange = function(index) {
      var artist = {};
      $scope.processing = true;
      AdminDLGateService
        .resolveData({
          url: $scope.track.artists[index].url
        })
        .then(function(res) {
          $scope.track.artists[index].avatar = res.data.avatar_url;
          $scope.track.artists[index].username = res.data.username;
          $scope.track.artists[index].id = res.data.id;
          $scope.processing = false;
        })
        .catch(function(err) {
          $.Zebra_Dialog('Artists not found');
          $scope.processing = false;
        });
    };

    $scope.addPlaylist = function() {
      $scope.track.playlists.push({
        url: '',
        avatar: '',
        title: '',
        id: ''
      });
    }
    $scope.removePlaylist = function(index) {
      $scope.track.playlists.splice(index, 1);
    }
    $scope.playlistURLChange = function(index) {
      $scope.processing = true;
      AdminDLGateService
        .resolveData({
          url: $scope.track.playlists[index].url
        })
        .then(function(res) {
          $scope.track.playlists[index].avatar = res.data.artwork_url;
          $scope.track.playlists[index].title = res.data.title;
          $scope.track.playlists[index].id = res.data.id;
          $scope.processing = false;
        })
        .then(null, function(err) {
          $.Zebra_Dialog('Playlist not found');
          $scope.processing = false;
        })
    }


    $scope.removeArtist = function(index) {
      $scope.track.artists.splice(index, 1);
    }

    $scope.addArtist = function() {
      if ($scope.track.artists.length > 2) {
        return false;
      }

      $scope.track.artists.push({
        url: '',
        avatar: 'assets/images/who-we-are.png',
        username: '',
        id: -1
      });
    }

    $scope.addSMLink = function() {
      // externalSMLinks++;
      // $scope.track.SMLinks['key' + externalSMLinks] = '';
      $scope.track.SMLinks.push({
        key: '',
        value: ''
      });
    };
    $scope.removeSMLink = function(index) {
      $scope.track.SMLinks.splice(index, 1);
    };
    $scope.SMLinkChange = function(index) {

      function getLocation(href) {
        var location = document.createElement("a");
        location.href = href;
        if (location.host == "") {
          location.href = location.href;
        }
        return location;
      }

      var location = getLocation($scope.track.SMLinks[index].value);
      var host = location.hostname.split('.')[0];
      var findLink = $scope.track.SMLinks.filter(function(item) {
        return item.key === host;
      });
      if (findLink.length > 0) {
        return false;
      }
      $scope.track.SMLinks[index].key = host;
    };

    $scope.saveDownloadGate = function() {
      if (!$scope.track.trackID) {
        $.Zebra_Dialog('Track Not Found');
        return false;
      }
      $scope.processing = true;
      var sendObj = new FormData();

      /* Append data to sendObj start */

      /* Track */
      for (var prop in $scope.track) {
        sendObj.append(prop, $scope.track[prop]);
      }

      /* artists */

      var artists = $scope.track.artists.filter(function(item) {
        return item.id !== -1;
      }).map(function(item) {
        delete item['$$hashKey'];
        return item;
      });
      sendObj.append('artists', JSON.stringify(artists));

      /* playlists */

      var playlists = $scope.track.playlists.filter(function(item) {
        return item.id !== -1;
      }).map(function(item) {
        delete item['$$hashKey'];
        return item;
      });
      sendObj.append('playlists', JSON.stringify(playlists));

      /* SMLinks */

      var SMLinks = {};
      $scope.track.SMLinks.forEach(function(item) {
        SMLinks[item.key] = item.value;
      });
      sendObj.append('SMLinks', JSON.stringify(SMLinks));

      /* Append data to sendObj end */

      var options = {
        method: 'POST',
        url: '/api/database/downloadurl',
        headers: {
          'Content-Type': undefined
        },
        transformRequest: angular.identity,
        data: sendObj
      };
      $http(options)
        .then(function(res) {
          $scope.processing = false;
          if ($scope.track._id) {
            // $scope.openModal.downloadURL(res.data.trackURL);
            return;
          }
          resetDownloadGateway();
          $scope.openModal.downloadURL(res.data);
        })
        .then(null, function(err) {
          $scope.processing = false;
          $.Zebra_Dialog("ERROR: Error in saving url");
          $scope.processing = false;
        });
    };

    $scope.logout = function() {
      $http.post('/api/logout').then(function() {
        SessionService.deleteUser();
        $state.go('admin');
      });
    };

    $scope.showProfileInfo = function() {
      $scope.profile = SessionService.getUser();
    }

    $scope.getDownloadList = function() {
      AdminDLGateService
        .getDownloadList()
        .then(handleResponse)
        .catch(handleError);

      function handleResponse(res) {
        $scope.downloadGatewayList = res.data;
      }

      function handleError(res) {

      }
    }

    /* Method for getting DownloadGateway in case of edit */

    $scope.getDownloadGateway = function(downloadGateWayID) {
      // resetDownloadGateway();
      $scope.processing = true;
      AdminDLGateService
        .getDownloadGateway({
          id: downloadGateWayID
        })
        .then(handleResponse)
        .catch(handleError);

      function handleResponse(res) {

        $scope.isTrackAvailable = true;
        $scope.track = res.data;

        var SMLinks = res.data.SMLinks ? res.data.SMLinks : {};
        var SMLinksArray = [];

        for (var link in SMLinks) {
          SMLinksArray.push({
            key: link,
            value: SMLinks[link]
          });
        }
        $scope.track.SMLinks = SMLinksArray;
        $scope.processing = false;
      }

      function handleError(res) {
        $scope.processing = false;
      }
    };

    $scope.deleteDownloadGateway = function(index) {

      if (confirm("Do you really want to delete this track?")) {
        var downloadGateWayID = $scope.downloadGatewayList[index]._id;
        $scope.processing = true;
        AdminDLGateService
          .deleteDownloadGateway({
            id: downloadGateWayID
          })
          .then(handleResponse)
          .catch(handleError);

        function handleResponse(res) {
          $scope.processing = false;
          $scope.downloadGatewayList.splice(index, 1);
        }

        function handleError(res) {
          $scope.processing = false;
        }
      } else {
        return false
      }
    };
  }

]);