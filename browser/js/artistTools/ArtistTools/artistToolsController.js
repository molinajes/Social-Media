app.config(function($stateProvider) {
  $stateProvider
    .state('artistTools', {
      url: '/artistTools',
      templateUrl: 'js/artistTools/ArtistTools/artistTools.html',
      controller: 'ArtistToolsController',
      abstract: true,
      resolve: {
        allowed: function($q, $state, SessionService) {
          var deferred = $q.defer();
          var user = SessionService.getUser();
          if (user) {
            deferred.resolve();
          } else {
            deferred.reject();
            window.location.href = '/login';
          }
          return deferred.promise;
        }
      }
    })
    .state('artistToolsProfile', {
      url: '/artistTools/profile',
      templateUrl: 'js/artistTools/ArtistTools/profile.html',
      controller: 'ArtistToolsController'
    })
    .state('artistToolsDownloadGatewayList', {
      url: '/artistTools/downloadGateway',
      params: {
        submission: null
      },
      templateUrl: 'js/artistTools/ArtistTools/downloadGateway.list.html',
      controller: 'ArtistToolsController'
    })
});

app.controller('ArtistToolsController', function($rootScope, $state, $stateParams, $scope, $http, $location, $window, $uibModal, $timeout, SessionService, ArtistToolsService) {
    $scope.user = SessionService.getUser();
    if (!SessionService.getUser()) {
      var path = window.location.pathname;
      if (path == "/artistTools/profile") {
        $window.localStorage.setItem('returnstate', 'artistToolsProfile');
      } else if (path == "/artistTools/downloadGateway") {
        $window.localStorage.setItem('returnstate', 'artistToolsDownloadGatewayList');
      }
      $state.go('login');
    } else {
      $window.localStorage.removeItem('returnstate');
    }
    var path = window.location.pathname;
    $scope.isAdminRoute = false;
    if (path.indexOf("admin/") != -1) {
      $scope.isAdminRoute = true
    } else {
      $scope.isAdminRoute = false;
    }
    $scope.linkedAccountData = {};
    $scope.thirdPartyInfo = ($scope.user.thirdPartyInfo ? $scope.user.thirdPartyInfo : null);
    $scope.hasThirdPartyFields = ($scope.user.thirdPartyInfo ? true : false);
    /* Init boolean variables for show/hide and other functionalities */
    $scope.processing = false;
    $scope.isTrackAvailable = false;
    $scope.message = {
      val: '',
      visible: false
    };

    /* Apply page end */
    $scope.gotoSettings = function() {
      SessionService.addActionsfoAccount('Admin', $scope.user._id)
      $state.go("basicstep1");
    }

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
    //overlay autofill track start//
    $scope.linkedAccounts = [];
    $scope.autoFillTracks = [];
    $scope.trackList = [];
    $scope.trackListObj = null;
    $scope.trackListSlotObj = null;
    $scope.newQueueSong = "";
    $scope.tracksQueue = [];

    $scope.trackChange = function(index) {
      $scope.makeEventURL = $scope.trackListSlotObj.permalink_url;
      $scope.changeURL();
    };

    $scope.trackListChange = function(index) {
      $scope.newQueueSong = $scope.trackListObj.permalink_url;
      $scope.processing = true;
      $scope.changeQueueSong();
    };

    $scope.showThridPartyBox = function() {
      $scope.hasThirdPartyFields = true;
    }

    $scope.permanentLinks = [];
    $scope.choseArtist = function(artist) {
      var permanentLink = {};
      $scope.profile.data.permanentLinks.push({
        url: artist.permalink_url,
        avatar: artist.avatar_url ? artist.avatar_url : '',
        username: artist.username,
        id: artist.id,
        permanentLink: true
      });
    }
    $scope.addSong = function() {
      if ($scope.user.queue.indexOf($scope.newQueueID) != -1) return;
      if ($scope.tracksQueue.length > 0) {
        for (var i = 0; i < $scope.tracksQueue.length; i++) {
          if ($scope.user.queue.indexOf($scope.tracksQueue[i]) == -1) {
            $scope.user.queue.push($scope.tracksQueue[i]);
          }
        }
      } else {
        if ($scope.newQueueID != null) {
          $scope.user.queue.push($scope.newQueueID);
        }
      }
      $scope.saveUser();
      $scope.newQueueSong = undefined;
      $scope.trackListObj = "";
      $scope.newQueue = undefined;
      $scope.tracksQueue = [];
    }

    $scope.changeQueueSong = function() {
      if ($scope.newQueueSong != "") {
        $scope.processing = true;
        $http.post('/api/soundcloud/resolve', {
            url: $scope.newQueueSong
          })
          .then(function(res) {
            $scope.processing = false;
            var track = res.data;
            if (track.kind == "playlist") {
              var tracksArr = track.tracks;
              angular.forEach(tracksArr, function(t) {
                $scope.newQueueID = t.id;
                $scope.tracksQueue.push($scope.newQueueID);
              });
            } else {
              $scope.newQueue = track;
              $scope.newQueueID = track.id;
            }
            $scope.processing = false;
          })
          .then(null, function(err) {
            $.Zebra_Dialog("We are not allowed to access tracks by this artist with the Soundcloud API. We apologize for the inconvenience, and we are working with Soundcloud to resolve this issue.");
            $scope.processing = false;
          });
      }
    }

    $scope.saveUser = function() {
      $scope.processing = true;
      $http.put("/api/database/profile", $scope.user)
        .then(function(res) {
          SessionService.create(res.data);
          $scope.user = SessionService.getUser();
          $scope.processing = false;
          $scope.loadQueueSongs();
          // $window.location.reload();
        })
        .then(null, function(err) {
          $.Zebra_Dialog("Error: did not save");
          $scope.processing = false;
        });
      $('#autoFillTrack').modal('hide');
    }

    $scope.getTrackListFromSoundcloud = function() {
      var profile = $scope.user;
      if (profile.soundcloud) {
        $scope.processing = true;
        SC.get('/users/' + profile.soundcloud.id + '/tracks', {
            filter: 'public'
          })
          .then(function(tracks) {
            $scope.trackList = tracks;
            $scope.processing = false;
            $scope.$apply();
          })
          .catch(function(response) {
            $scope.processing = false;
            $scope.$apply();
          });
      }
    }

    $scope.removeQueueSong = function(index) {
      $scope.user.queue.splice(index, 1);
      $scope.saveUser()
        //$scope.loadQueueSongs();
    }

    $scope.loadQueueSongs = function(queue) {
      $scope.autoFillTracks = [];
      $scope.user.queue.forEach(function(songID) {
        SC.get('/tracks/' + songID)
          .then(function(track) {
            $scope.autoFillTracks.push(track);
            $scope.$digest();
          }, console.log);
      })
    }
    if ($scope.user && $scope.user.queue) {
      $scope.loadQueueSongs();
    }
    //overlay autofill track end//
    $scope.closeModal = function() {
      $scope.modalInstance.close();
    };

    $scope.saveNotifications = function() {
      $http.put('/api/database/profile/notifications', $scope.profile.data)
        .then(function(res) {
          SessionService.create(res.data);
          $scope.user = SessionService.getUser();
        })
        .catch(function(res) {
          $.Zebra_Dialog('error saving');
        });
    }

    $scope.editProfileModalInstance = {};
    $scope.editProfilemodal = {};
    $scope.openEditProfileModal = {
      editProfile: function(field) {
        $scope.profile.field = field;
        $timeout(function() {
          $scope.editProfileModalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'editProfile.html',
            controller: 'ArtistToolsController',
            scope: $scope
          });
        }, 0);
      }
    };

    $scope.closeEditProfileModal = function() {
      $scope.showProfileInfo();
      if ($scope.editProfileModalInstance.close) {
        $scope.editProfileModalInstance.close();
      }
    };

    $scope.thankYouModalInstance = {};
    $scope.thankYouModal = {};
    $scope.openThankYouModal = {
      thankYou: function(submissionID) {
        $scope.thankYouModal.submissionID = submissionID;
        $scope.modalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'thankYou.html',
          controller: 'OpenThankYouModalController',
          scope: $scope
        });
      }
    };
    $scope.closeThankYouModal = function() {
      $scope.thankYouModalInstance.close();
    };
    /* Init profile */
    $scope.profile = {};
    if ($stateParams.submission) {
      $scope.openThankYouModal.thankYou($stateParams.submission._id);
    }
    $scope.showProfileInfo = function() {
      $scope.profile.data = SessionService.getUser();
      if (($scope.profile.data.permanentLinks && $scope.profile.data.permanentLinks.length === 0) || !$scope.profile.data.permanentLinks) {
        $scope.profile.data.permanentLinks = [{
          url: '',
          avatar: '',
          username: '',
          id: -1,
          permanentLink: true
        }];
      };
      $scope.profile.isAvailable = {};
      $scope.profile.isAvailable.email = $scope.profile.data.email ? true : false;
      $scope.profile.isAvailable.password = $scope.profile.data.password ? true : false;
      $scope.profile.isAvailable.soundcloud = $scope.profile.data.soundcloud ? true : false;
      $scope.profile.data.password = '';
    };

    $scope.saveProfileInfo = function() {
      $scope.message = {
        value: '',
        visible: false
      };
      var permanentLinks = $scope.profile.data.permanentLinks.filter(function(item) {
        return item.id !== -1;
      }).map(function(item) {
        delete item['$$hashKey'];
        return item;
      });

      var sendObj = {
        name: '',
        password: '',
        email: '',
        permanentLinks: JSON.stringify(permanentLinks)
      }
      if ($scope.profile.field === 'name') {
        sendObj.name = $scope.profile.data.name;
      } else if ($scope.profile.field === 'password') {
        sendObj.password = $scope.profile.data.password;
      } else if ($scope.profile.field === 'email') {
        sendObj.email = $scope.profile.data.email;
      }

      $scope.processing = true;
      ArtistToolsService
        .saveProfileInfo(sendObj)
        .then(function(res) {
          $scope.processing = false;
          if (res.data === 'Email Error') {
            $scope.message = {
              value: 'Email already exists!',
              visible: true
            };
            return;
          }
          if (permanentLinks != "") {
            $scope.linkUrl = "";
          }
          SessionService.create(res.data);
          $scope.user = SessionService.getUser();
          $scope.closeEditProfileModal();
        })
        .catch(function(res) {
          $scope.processing = false;
          $.Zebra_Dialog('error saving');
        });
    };

    // remove linked accounts
    $scope.removeLinkedAccount = function(account) {
      $rootScope.userlinkedAccounts.splice($rootScope.userlinkedAccounts.indexOf(account), 1);
      $http.put('/api/database/networkaccount', $rootScope.userlinkedAccounts)
        .then(function(res) {
          $rootScope.userlinkedAccounts = res.data.channels;
          $rootScope.userlinkedAccounts = res.data.channels;
        })
    }

    $scope.removePermanentLink = function(index) {
      $scope.profile.data.permanentLinks.splice(index, 1);
      $scope.saveProfileInfo();
    };

    $scope.hidebutton = false;
    $scope.addPermanentLink = function() {

      if ($scope.profile.data.permanentLinks.length >= 2 && !$scope.user.admin) {
        $scope.hidebutton = true;
      }

      if ($scope.profile.data.permanentLinks.length > 2 && !$scope.user.admin) {
        return false;
      }

      $scope.profile.data.permanentLinks.push({
        url: '',
        avatar: '',
        username: '',
        id: -1,
        permanentLink: true
      });
    };

    $scope.permanentLinkURLChange = function() {
      var permanentLink = {};
      $scope.processing = true;
      ArtistToolsService
        .resolveData({
          url: $scope.linkUrl
        })
        .then(function(res) {
          $scope.profile.data.permanentLinks.push({
            url: res.data.permalink_url,
            avatar: res.data.avatar_url ? res.data.avatar_url : '',
            username: res.data.username,
            id: res.data.id,
            permanentLink: true
          });
          $scope.processing = false;
        })
        .catch(function(err) {
          $.Zebra_Dialog('Artists not found');
          $scope.processing = false;
        });
    };

    $scope.saveSoundCloudAccountInfo = function() {
      SC.connect()
        .then(saveInfo)
        .then(handleResponse)
        .catch(handleError);

      function saveInfo(res) {
        return ArtistToolsService.saveSoundCloudAccountInfo({
          token: res.oauth_token
        });
      }

      function handleResponse(res) {
        $scope.processing = false;
        if (res.status === 200 && (res.data.success === true)) {
          SessionService.create(res.data.data);
          $scope.profile.data = res.data.data;
          $scope.profile.isAvailable.soundcloud = true;
        } else {
          $scope.message = {
            value: 'You already have an account with this soundcloud username',
            visible: true
          };
        }
        $scope.$apply();
      }

      function handleError(err) {
        $scope.processing = false;
      }
    };

    $scope.getDownloadList = function() {
      ArtistToolsService
        .getDownloadList()
        .then(handleResponse)
        .catch(handleError);

      function handleResponse(res) {
        $scope.downloadGatewayList = res.data;
      }

      function handleError(err) {
        console.log(err)
      }
    };

    $scope.deleteDownloadGateway = function(index) {
      if (confirm("Do you really want to delete this track?")) {
        var downloadGateWayID = $scope.downloadGatewayList[index]._id;
        $scope.processing = true;
        ArtistToolsService
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
      }
    };

    $scope.soundcloudLogin = function() {
      SC.connect()
        .then(function(res) {
          if (res.oauth_token == SessionService.getUser().soundcloud.token) {
            throw new Error('already added');
          } else {
            $scope.processing = true;
            $rootScope.accessToken = res.oauth_token;
            return $http.post('/api/login/soundCloudAuthentication', {
              token: res.oauth_token,
              password: 'test'
            });
          }
        })
        .then(function(res) {
          var linkedAccountID = res.data.user._id;
          $http.post("/api/database/networkaccount", {
              userID: $scope.user._id,
              linkedAccountID: linkedAccountID
            })
            .then(function(res) {
              $.Zebra_Dialog(res.data.message);
              $rootScope.userlinkedAccounts = res.data.data.channels;
              setTimeout(function() {
                window.location.reload();
              }, 1000);
            });
        })
        .then(null, function(err) {
          console.log(err);
          if (err.message == 'already added') {
            $scope.processing = false;
            window.localStorage.setItem('samelinkedaccount', true);
            window.location.reload();
          }
        });
    };

    if (window.localStorage.getItem('samelinkedaccount')) {
      window.localStorage.removeItem('samelinkedaccount');
      $scope.soundcloudLogin();
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

    $scope.getUserNetwork();
    $scope.verifyBrowser();
  })
  .controller('OpenThankYouModalController', function($scope) {})