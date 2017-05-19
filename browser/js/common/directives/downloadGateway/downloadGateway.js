app.directive('dlgate', function($http) {
  return {
    templateUrl: 'js/common/directives/downloadGateway/downloadGateway.html',
    restrict: 'E',
    scope: false,
    controller: function dlGateController($rootScope, $state, $stateParams, $scope, $http, $location, $window, $uibModal, $timeout, SessionService, ArtistToolsService, AdminDLGateService) {
      $scope.showTitle = [];
      $scope.user = SessionService.getUser();
      $scope.track = {
        artistUsername: '',
        trackTitle: '',
        trackArtworkURL: '',
        SMLinks: [],
        like: false,
        comment: false,
        repost: false,
        artists: [],
        playlists: [],
        youtube: [],
        twitter: [],
        showDownloadTracks: 'user',
        admin: $scope.user.admin,
        file: {}
      };

      var path = $window.location.pathname;
      $scope.isAdminRoute = false;
      if (path.indexOf("admin/") != -1) {
        $scope.isAdminRoute = true
      } else {
        $scope.isAdminRoute = false;
      }

      $scope.profile = {};
      /* Init track list and trackListObj*/
      $scope.trackList = [];
      $scope.trackListObj = null;

      /* Method for resetting Download Gateway form */

      $scope.trackListChange = function(index) {

        /* Set booleans */

        $scope.isTrackAvailable = false;
        $scope.processing = true;

        /* Set track data */

        var track = $scope.trackListObj;
        $scope.track.trackURL = track.permalink_url;
        $scope.track.trackTitle = track.title;
        $scope.track.trackID = track.id;
        $scope.track.artistID = track.user.id;
        $scope.track.description = track.description;
        $scope.track.trackArtworkURL = track.artwork_url ? track.artwork_url.replace('large.jpg', 't500x500.jpg') : '';
        $scope.track.artistArtworkURL = track.user.avatar_url ? track.user.avatar_url : '';
        $scope.track.artistURL = track.user.permalink_url;
        $scope.track.artistUsername = track.user.username;
        $scope.track.SMLinks = [];

        SC.get('/users/' + $scope.track.artistID + '/web-profiles')
          .then(handleWebProfiles)
          .catch(handleError);

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
          if (!$scope.$$phase) $scope.$apply();
        }

        function handleError(err) {
          $scope.track.trackID = null;
          $.Zebra_Dialog('Song not found or forbidden');
          $scope.processing = false;
          if (!$scope.$$phase) $scope.$apply();
        }
      };

      $scope.openYoutubeModal = function() {
        $('#youtube').modal('show');
      }

      $scope.removeSMLink = function(index) {
        $scope.track.SMLinks.splice(index, 1);
      };

      $scope.saveDownloadGate = function() {
        if ($scope.track.youtube && $scope.track.youtube.length > 0) {
          $scope.track.socialPlatformValue = $scope.track.youtube.toString();
        } else if ($scope.track.twitter && $scope.track.twitter.length > 0) {
          $scope.track.socialPlatformValue = $scope.track.twitter.toString();
        }

        if (!($scope.track.downloadURL.includes('http') || ($scope.track.file && $scope.track.file.name))) {
          $.Zebra_Dialog('Provide a download file or link (include "http://").');
          return false;
        }

        if (!$scope.track.trackID) {
          $.Zebra_Dialog('Track Not Found');
          return false;
        }
        $scope.processing = true;
        var sendObj = new FormData();
        for (var prop in $scope.track) {
          sendObj.append(prop, $scope.track[prop]);
        }
        var artists = $scope.track.artists.filter(function(item) {
          return item.id !== -1;
        }).map(function(item) {
          delete item['$$hashKey'];
          return item;
        });

        var playlists = $scope.track.playlists.filter(function(item) {
          return item.id !== -1;
        }).map(function(item) {
          delete item['$$hashKey'];
          return item;
        });

        sendObj.append('artists', JSON.stringify(artists));
        var SMLinks = {};
        $scope.track.SMLinks.forEach(function(item) {
          SMLinks[item.key] = item.value;
        });
        sendObj.append('SMLinks', JSON.stringify(SMLinks));
        if ($scope.track.playlists) {
          sendObj.append('playlists', JSON.stringify($scope.track.playlists));
        }

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
            if ($stateParams.submission) {
              if ($scope.isAdminRoute) {
                $state.go('adminDownloadGatewayList', {
                  'submission': $stateParams.submission
                });
              } else {
                $state.go('artistToolsDownloadGatewayList', {
                  'submission': $stateParams.submission
                });
              }

            } else {
              if ($scope.user.soundcloud.id == $scope.track.artistID) {
                $.Zebra_Dialog('Download gateway was saved and added to the track.');
              } else {
                $.Zebra_Dialog('Download gateway saved.');
              }
              if ($scope.isAdminRoute) {
                $state.go('adminDownloadGateway');
              } else {
                $state.go('artistToolsDownloadGatewayList');
              }
            }
          })
          .then(null, function(err) {
            $scope.processing = false;
            $.Zebra_Dialog("ERROR: Error in saving url");
            $scope.processing = false;
          });
      };

      $scope.checkIfEdit = function() {
        if ($stateParams.gatewayID) {
          $scope.getDownloadGateway($stateParams.gatewayID);
        }
      };

      $scope.getTrackListFromSoundcloud = function() {
        var profile = SessionService.getUser();
        if (profile.soundcloud) {
          $scope.processing = true;
          SC.get('/users/' + profile.soundcloud.id + '/tracks', {
              filter: 'public'
            })
            .then(function(tracks) {
              $scope.trackList = tracks;
              $scope.processing = false;
              if (!$scope.$$phase) $scope.$apply();
            })
            .catch(function(response) {
              $scope.processing = false;
              if (!$scope.$$phase) $scope.$apply();
            });
        }
      }

      $scope.checkIfSubmission = function() {
        if ($stateParams.submission) {
          if ($state.includes('artistToolsDownloadGatewayNew')) {
            $scope.track.trackURL = $rootScope.submission.trackURL;
            $scope.trackURLChange();
            return;
          }

          $scope.openThankYouModal.thankYou($stateParams.submission._id);
          $rootScope.submission = null;
        }
      }

      $scope.resolveYoutube = function(youtube) {
        if (!(youtube.includes('/channel/') || youtube.includes('/user/'))) {
          $.Zebra_Dialog('Enter a valid Youtube channel url.');
          return;
        } else {
          var length = $scope.track.youtube.length;
          if ($scope.track.youtube.indexOf(youtube) == -1) {
            $scope.track.youtube[length - 1] = youtube;
          }
        }
      }

      $scope.resolveTwitter = function(twitter) {
        var length = $scope.track.twitter.length;
        if ($scope.track.twitter.indexOf(twitter) == -1) {
          $scope.track.twitter[length - 1] = twitter;
        }
      }

      $scope.trackURLChange = function() {
        if ($scope.track.trackURL !== '') {
          $scope.isTrackAvailable = false;
          $scope.processing = true;
          ArtistToolsService.resolveData({
            url: $scope.track.trackURL
          }).then(handleTrackDataAndGetProfiles).then(handleWebProfiles).catch(handleError);

          function handleTrackDataAndGetProfiles(res) {
            $scope.track.trackTitle = res.data.title;
            $scope.track.trackID = res.data.id;
            $scope.track.artistID = res.data.user.id;
            $scope.track.description = res.data.description;
            $scope.track.trackArtworkURL = res.data.artwork_url ? res.data.artwork_url.replace('large.jpg', 't500x500.jpg') : '';
            $scope.track.artistArtworkURL = res.data.user.avatar_url ? res.data.user.avatar_url.replace('large.jpg', 't500x500.jpg') : '';
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
      }

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
        if (host === 'www') host = location.hostname.split('.')[1];
        var findLink = $scope.track.SMLinks.filter(function(item) {
          return item.key === host;
        });

        if (findLink.length > 0) {
          return false;
        }
        $scope.track.SMLinks[index].key = host;
      }

      $scope.addSMLink = function() {
        $scope.track.SMLinks.push({
          key: '',
          value: ''
        });
      }

      $scope.clearOrFile = function() {
        if ($scope.track.downloadURL) {
          angular.element("input[type='file']").val(null);
        }
      }

      $scope.artistURLChange = function(index) {
        var artist = {};
        if ($scope.track.artists[index].url != "") {
          $scope.processing = true;
          ArtistToolsService.resolveData({
            url: $scope.track.artists[index].url
          }).then(function(res) {
            $scope.track.artists[index].avatar = res.data.avatar_url ? res.data.avatar_url : '';
            $scope.track.artists[index].username = res.data.username;
            $scope.track.artists[index].id = res.data.id;
            $scope.processing = false;
          }).catch(function(err) {
            $.Zebra_Dialog('Artists not found');
            $scope.processing = false;
          });
        }
      }

      $scope.choseArtist = function(artist) {
        var permanentLink = {};
        $scope.track.artists.push({
          url: artist.permalink_url,
          avatar: artist.avatar_url ? artist.avatar_url : '',
          username: artist.username,
          id: artist.id,
          permanentLink: true
        });
      }
      $scope.chosePlaylist = function(playlist) {
        var permanentLink = {};
        $scope.track.playlists.push({
          url: playlist.permalink_url,
          avatar: playlist.avatar_url ? playlist.avatar_url : '',
          title: playlist.title,
          id: playlist.id,
        });
      }
      $scope.choseTrack = function(item) {
        $scope.searchSelection = [];
        $scope.searchError = undefined;
        $scope.searchString = item.displayName;
        $scope.track.trackTitle = item.title;
        $scope.track.trackID = item.id;
        $scope.track.artistID = item.user.id;
        $scope.track.description = item.description;
        $scope.track.trackArtworkURL = item.artwork_url ? item.artwork_url.replace('large.jpg', 't500x500.jpg') : '';
        $scope.track.artistArtworkURL = item.user.avatar_url ? item.user.avatar_url.replace('large.jpg', 't500x500.jpg') : '';
        $scope.track.artistURL = item.user.permalink_url;
        $scope.track.artistUsername = item.user.username;
        $scope.track.SMLinks = [];
        SC.get('/users/' + $scope.track.artistID + '/web-profiles')
          .then(handleWebProfiles)
          .catch(handleError);

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
          if (!$scope.$$phase) $scope.$apply();
        }

        function handleError(err) {
          $scope.track.trackID = null;
          $.Zebra_Dialog('Song not found or forbidden');
          $scope.processing = false;
          if (!$scope.$$phase) $scope.$apply();
        }
      }

      $scope.removeArtist = function(index) {
        $scope.track.artists.splice(index, 1);
      }

      $scope.addArtist = function() {
        $scope.track.artists.push({
          url: '',
          avatar: '',
          username: '',
          id: -1,
          permanentLink: false
        });
      }
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

      function resetDownloadGateway() {
        $scope.processing = false;
        $scope.isTrackAvailable = false;
        $scope.message = {
          val: '',
          visible: false
        };

        $scope.track = {
          artistUsername: '',
          trackTitle: '',
          trackArtworkURL: '',
          SMLinks: [],
          like: false,
          comment: false,
          repost: false,
          artists: [{
            url: '',
            avatar: '',
            username: '',
            id: -1,
            permanentLink: false
          }],
          showDownloadTracks: 'user'
        };
        angular.element("input[type='file']").val(null);
      }

      /* Method for getting DownloadGateway in case of edit */

      $scope.getDownloadGateway = function(downloadGateWayID) {
        // resetDownloadGateway();
        $scope.processing = true;
        ArtistToolsService
          .getDownloadGateway({
            id: downloadGateWayID
          })
          .then(handleResponse)
          .catch(handleError);

        function handleResponse(res) {

          $scope.isTrackAvailable = true;
          $scope.track = res.data;
          $scope.track.youtube = [];
          $scope.track.twitter = [];
          if ($scope.track.socialPlatformValue) {
            if ($scope.track.socialPlatform == 'youtubeSubscribe') {
              if ($scope.track.socialPlatformValue.indexOf(',') > -1) {
                var urls = $scope.track.socialPlatformValue.split(',');
                for (var i = 0; i < urls.length; i++) {
                  $scope.track.youtube.push(urls[i]);
                }
              } else {
                $scope.track.youtube.push($scope.track.socialPlatformValue);
              }
            } else if ($scope.track.socialPlatform == 'twitterFollow') {
              $scope.track.twitter = [];
              if ($scope.track.socialPlatformValue.indexOf(',') > -1) {
                var urls = $scope.track.socialPlatformValue.split(',');
                for (var i = 0; i < urls.length; i++) {
                  $scope.track.twitter.push(urls[i]);
                }
              } else {
                $scope.track.twitter.push($scope.track.socialPlatformValue);
              }
            }
          }


          $scope.searchString = $scope.track.trackTitle;
          var SMLinks = res.data.SMLinks ? res.data.SMLinks : {};
          var permanentLinks = res.data.permanentLinks ? res.data.permanentLinks : [''];
          var SMLinksArray = [];
          var permanentLinksArray = [];

          for (var link in SMLinks) {
            SMLinksArray.push({
              key: link,
              value: SMLinks[link]
            });
          }
          permanentLinks.forEach(function(item) {
            permanentLinksArray.push({
              url: item
            })
          });
          if (!$scope.track.showDownloadTracks) {
            $scope.track.showDownloadTracks = 'user';
          }
          $scope.track.SMLinks = SMLinksArray;
          $scope.track.permanentLinks = permanentLinksArray;
          $scope.track.playlistIDS = [];
          // $scope.track.showDownloadTracks = ($scope.track.showDownloadTracks === 'user') ? true : false;
          //console.log($scope.track);
          $scope.processing = false;
        }

        function handleError(res) {
          $scope.processing = false;
        }
      };

      $scope.clearOrInput = function() {
        $scope.track.downloadURL = "";
      }

      $scope.preview = function(track) {
        window.localStorage.setItem('trackPreviewData', JSON.stringify(track));
        var url = $scope.isAdminRoute ? $state.href('adminDownloadGatewayPreview') : $state.href('artistToolsDownloadGatewayPreview');
        //var url = $state.href('artistToolsDownloadGatewayPreview');
        $window.open(url, '_blank');
      }

      $scope.verifyBrowser = function() {
        if (navigator.userAgent.search("Chrome") == -1 && navigator.userAgent.search("Safari") != -1) {
          var position = navigator.userAgent.search("Version") + 8;
          var end = navigator.userAgent.search(" Safari");
          var version = navigator.userAgent.substring(position, end);
          if (parseInt(version) < 9) {
            $.Zebra_Dialog('You have old version of safari. Click <a href="https://support.apple.com/downloads/safari">here</a> to download the latest version of safari for better site experience.', {
              'type': 'confirmation',
              'buttons': [{
                caption: 'OK'
              }],
              'onClose': function() {
                $window.location.href = "https://support.apple.com/downloads/safari";
              }
            });
          }
        }
      }

      $scope.addYouTubeUrl = function() {
        $scope.track.youtube.push('');
      }
      $scope.removeYouTubes = function(index) {
        $scope.track.youtube.splice(index, 1);
      }

      $scope.addTwitterUrl = function() {
        $scope.track.twitter.push('');
      }
      $scope.removeTwitter = function(index) {
        $scope.track.twitter.splice(index, 1);
      }
      $scope.getUserNetwork();
      $scope.verifyBrowser();
    }
  }
});