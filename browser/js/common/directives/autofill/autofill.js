app.directive('autofill', function($http) {
  return {
    templateUrl: 'js/common/directives/autofill/autofill.html',
    restrict: 'E',
    scope: false,
    controller: ['$scope', function autofillController($scope) {
      $scope.autoFillTracks = [];

      $scope.removeQueueSong = function(song) {
        var index = $scope.user.queue.indexOf(song.id);
        $scope.user.queue.splice(index, 1);
        $scope.saveUser()
        $scope.loadQueueSongs();
      }

      $scope.removeAll = function() {
        $scope.user.queue = [];
        $scope.saveUser()
        $scope.loadQueueSongs();
      }

      $scope.addSong = function() {
        if ($scope.user.queue.indexOf($scope.newQueueID) != -1) return;
        $scope.user.queue.push($scope.newQueueID);
        $scope.saveUser();
        $scope.loadQueueSongs();
      }

      /*sort start*/
      $scope.sortableOptions = {
        stop: function(e, ui) {
          var logEntry = $scope.autoFillTracks.map(function(i) {
            return i.id;
          });
          $scope.user.queue = logEntry;
          $scope.saveUser();
        }
      };
      /*sort end*/
      $scope.loadQueueSongs = function(queue) {
        if ($scope.disallowQueueLoad) return;
        $scope.disallowQueueLoad = true;
        setTimeout(function() {
          $scope.disallowQueueLoad = false;
        }, 1000);
        var autofillWidget = SC.Widget('autofillPlayer');
        $scope.autoFillTracks = [];
        $scope.user.queue.forEach(function(trackID, index) {
          SC.get('/tracks/' + trackID)
            .then(function(data) {
              $scope.autoFillTracks[index] = data;
              if (!$scope.$$phase) $scope.$apply();
            }).then(null, function(err) {
              if (err.status == 403) {
                function loadTrack(id, ind) {
                  if (!$scope.loadingAFWidget) {
                    $scope.loadingAFWidget = true;
                    $scope.showAutofillPlayer = true;
                    autofillWidget.load("http://api.soundcloud.com/tracks/" + id, {
                      auto_play: false,
                      show_artwork: false,
                      callback: function() {
                        autofillWidget.getCurrentSound(function(track) {
                          $scope.loadingAFWidget = false;
                          $scope.showAutofillPlayer = false;
                          $scope.autoFillTracks[ind] = track;
                          if (!$scope.$$phase) $scope.$apply();
                        });
                      }
                    });
                  } else {
                    setTimeout(function() {
                      loadTrack(id, ind);
                    }, 300)
                  }
                }
                loadTrack(trackID, index);
              } else if (err.status == 404) {
                $scope.user.queue.splice(index, 1);
                $scope.saveUser()
                $scope.loadQueueSongs();
              }
            }).then(null, console.log);
        });
      }
      if ($scope.user && $scope.user.queue && !$scope.alreadyLoaded) {
        $scope.loadQueueSongs();
        $scope.alreadyLoaded == true;
      }
      $scope.choseAutoFillTrack = function(track) {
        $scope.newQueueID = track.id;
        $scope.addSong();
      }

      $scope.choseAutoFillPlaylist = function(playlist) {
        playlist.tracks.forEach(function(track) {
          if ($scope.user.queue.indexOf(track.id) == -1) $scope.user.queue.push(track.id);
        })
        $scope.saveUser();
        $scope.loadQueueSongs();
      }

      $scope.afcount = 0;
      $scope.getAutoFillTracks = function() {
        function waitForAutofill() {
          $scope.processing = true;
          setTimeout(function() {
            if (!$scope.showAutofillPlayer) {
              $scope.processing = false;
              if (!$scope.$$phase) $scope.$apply();
              $scope.getAutoFillTracks();
            } else {
              waitForAutofill();
            }
          }, 500);
        }
        if ($scope.user.queue.length > 0) {
          if ($scope.autoFillTracks.includes(undefined) || $scope.autoFillTracks.length < $scope.user.queue.length) {
            waitForAutofill();
            return;
          }
          var track = JSON.parse(JSON.stringify($scope.autoFillTracks[$scope.afcount]));
          $scope.afcount = ($scope.afcount + 1) % $scope.autoFillTracks.length;
          $scope.makeEvent.trackID = track.id;
          if (window.location.href.includes('scheduler') && $scope.findUnrepostOverlap() && track.user.id != $scope.user.id) {
            if ($scope.afcount == 0) {
              $scope.showPlayer = false;
              $scope.makeEvent.trackID = undefined;
              $.Zebra_Dialog("No more autofill songs can be scheduled here. You are not allowed to repost a track within 24 hours of an unrepost of that track or within 48 hours of a repost of the same track.");
            } else {
              $scope.makeEvent.trackID = undefined;
              $scope.getAutoFillTracks();
            }
            return;
          } else {
            if ($scope.showOverlay) $scope.choseTrack1(track);
            else $scope.choseTrack(track);
          }
        } else {
          $scope.showOverlay = false;
          $.Zebra_Dialog('You do not have any tracks by other artists in your autofill list.', {
            'type': 'question',
            'buttons': [{
              caption: 'Cancel',
              callback: function() {}
            }, {
              caption: 'Autofill',
              callback: function() {
                $scope.tabSelected = true;
                $('.nav-tabs a[href="#managereposts"]').tab('show');
              }
            }]
          });
        }
      }
    }]
  }
});

function stackTrace() {
  var err = new Error();
  return err.stack;
}