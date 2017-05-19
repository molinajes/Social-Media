app.config(function($stateProvider) {
  $stateProvider.state('repostevents', {
    url: '/repostevents/:username/:trackTitle',
    templateUrl: 'js/repostEvents/views/repostEvents.html',
    controller: 'RepostEventsController',
    resolve: {
      repostEvent: function($http, $location, $stateParams) {
        var paid = $location.search().paid;
        var url = '/api/events/repostEvent/' + $stateParams.username + '/' + $stateParams.trackTitle + '/' + paid;
        return $http.get(url)
          .then(function(res) {
            var events = res.data.sort(function(a, b) {
              return new Date(a.trackInfo.day).getTime() - new Date(b.trackInfo.day).getTime();
            });
            console.log(events);
            return events;
          })
          .then(null, function(err) {
            $.Zebra_Dialog("This repost event does not exist.");
            return;
          })
      },
    }
  });
});

app.controller('RepostEventsController', function($rootScope, $state, $scope, repostEvent, $http, $location, $window, $q, $sce, $auth, SessionService) {
  if (!!repostEvent) {
    $scope.user = SessionService.getUser();
    $scope.itemview = "calender";
    $scope.setView = function(view) {
      $scope.itemview = view;
    };
    var daysArray = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    if (!!repostEvent) {
      $scope.listevents = repostEvent;
      $scope.trackImage = repostEvent[0].trackInfo.trackArtUrl;
      if (!repostEvent[0].trackInfo.trackArtUrl) {
        SC.get('/tracks/' + repostEvent[0].trackInfo.trackID)
          .then(function(track) {
            $scope.trackImage = track.artwork_url;
            $scope.listevents[0].trackInfo.artistName = track.user.username;
          })
      }
    };

    $scope.dayIncr = 7;
    $scope.incrDay = function() {
      if ($scope.dayIncr < 21) $scope.dayIncr++;
    }

    $scope.decrDay = function() {
      if ($scope.dayIncr > 0) $scope.dayIncr--;
    }

    $scope.dayOfWeekAsString = function(date) {
      var dayIndex = date.getDay();
      if (screen.width > '744') {
        return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex];
      }
      return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex];
    }

    $scope.getEventStyle = function(repostEvent) {
      if (repostEvent.type == 'empty') {
        return {
          'border-radius': '4px'
        }
      } else if (repostEvent.type == 'multiple') {
        return {
          'background-color': '#7A549B',
          'height': '20px',
          'border-radius': '4px'
        }
      } else if (repostEvent.trackInfo.type == 'track' || repostEvent.trackInfo.type == 'queue') {
        return {
          'background-color': '#FF7676',
          'border-radius': '4px'
        }
      } else if (repostEvent.trackInfo.type == 'traded') {
        return {
          'background-color': '#FFD450',
          'border-radius': '4px'
        }
      } else if (repostEvent.trackInfo.type == 'paid') {
        return {
          'background-color': '#FFBBDD',
          'border-radius': '4px'
        }
      }
    }
    $scope.followCounts = 0;
    repostEvent.forEach(function(ev) {
      ev.day = new Date(ev.trackInfo.day);
      if (ev.day > new Date()) $scope.followCounts += ev.userInfo.followers;
    });
    $scope.events = repostEvent;
    $scope.fillDateArrays = function(repostEvent) {
      var calendar = [];
      var today = new Date();
      today.setDate(today.getDate() - 7);
      for (var i = 0; i < 29; i++) {
        var calDay = {};
        calDay.day = new Date(today);
        calDay.day.setDate(today.getDate() + i);
        var dayEvents = repostEvent.filter(function(ev) {
          return (new Date(ev.trackInfo.day).toLocaleDateString() == calDay.day.toLocaleDateString());
        });
        var eventArray = [];
        for (var j = 0; j < 24; j++) {
          eventArray[j] = {
            type: "empty"
          };
        }
        dayEvents.forEach(function(ev) {
          if (eventArray[new Date(ev.trackInfo.day).getHours()].type == 'empty') {
            ev.type = 'track';
            eventArray[new Date(ev.trackInfo.day).getHours()] = ev;
          } else if (eventArray[new Date(ev.trackInfo.day).getHours()].type == 'track') {
            var event = {
              type: 'multiple',
              events: []
            }
            event.events.push(eventArray[new Date(ev.trackInfo.day).getHours()])
            event.events.push(ev);
            eventArray[new Date(ev.trackInfo.day).getHours()] = event;
          } else if (eventArray[new Date(ev.trackInfo.day).getHours()].type == 'multiple') {
            eventArray[new Date(ev.trackInfo.day).getHours()].events.push(ev);
          }
        });
        calDay.events = eventArray;
        calendar.push(calDay);
      }
      return calendar;
    };

    $scope.getEventText = function(repostEvent) {
      if (repostEvent.type == 'track') return repostEvent.userInfo.username
      else if (repostEvent.type == 'multiple') return 'Multiple Reposts'
    }

    $scope.backEvent = function() {
      $scope.makeEvent = null;
      $scope.trackType = "";
      $scope.trackArtistID = 0;
      $scope.showOverlay = false;
    }

    $scope.calendar = $scope.fillDateArrays(repostEvent);
    $scope.clickedSlot = function(day, hour, data) {
      if (data.type == 'multiple') {
        var buttons = [];
        data.events.forEach(function(ev) {
          var button = {
            caption: ev.userInfo.username,
            callback: function() {
              $scope.openPopup(day, hour, ev);
              if (!$scope.$$phase) $scope.$apply();
            }
          }
          buttons.push(button);
        })
        $.Zebra_Dialog('Which slot do you want to view?', {
          'type': 'question',
          'buttons': buttons
        });
      } else {
        $scope.openPopup(day, hour, data);
      }
    }

    $scope.openPopup = function(day, hour, data) {
      if (data.trackInfo) {
        $scope.makeEvent = {};
        $scope.popup = true;
        var makeDay = new Date(day);
        makeDay.setHours(hour);
        $scope.makeEvent.day = new Date(makeDay);
        $scope.makeEvent.url = data.trackInfo.trackURL;
        $scope.makeEvent.trackID = data.trackInfo.trackID;
        $scope.makeEvent.comment = data.trackInfo.comment;
        var diff = (new Date(data.trackInfo.unrepostDate).getTime() - new Date(data.trackInfo.day).getTime()) / 3600000;
        if (diff > 0) $scope.makeEvent.unrepostHours = diff;
        $scope.unrepostEnable = diff > 0;
        $scope.makeEvent.timeGap = data.trackInfo.timeGap;
        $scope.makeEvent.username = data.userInfo.username;
        $scope.makeEvent.followers = data.userInfo.followers;
        if (data.trackInfo.like) $scope.likeSrc = 'assets/images/likeTrue.svg';
        else $scope.likeSrc = 'assets/images/like.svg';
        if (data.trackInfo.comment) $scope.commentSrc = 'assets/images/comment.svg';
        else $scope.commentSrc = 'assets/images/noComment.svg';
        var d = new Date(day).getDay();
        var channels = data.trackInfo.otherChannels;
        $scope.displayChannels = [];
        for (var i = 0; i < repostEvent.length; i++) {
          if (channels.indexOf(repostEvent[i].userInfo.id) > -1) {
            $scope.displayChannels.push(repostEvent[i].userInfo.username);
          }
        }

        $scope.showOverlay = true;
        var calDay = {};
        var calendarDay = $scope.calendar.find(function(calD) {
          return calD.day.toLocaleDateString() == day.toLocaleDateString();
        })
        $scope.playerURL = $sce.trustAsResourceUrl("https://w.soundcloud.com/player/?url=http://api.soundcloud.com/tracks/" + $scope.makeEvent.trackID + "&auto_play=false&show_artwork=false")
        document.getElementById('scPopupPlayer').style.visibility = "visible";
      }
    }
    $scope.detailView = function(data) {
      $scope.itemview = "detailListView";
      $scope.makeEvent = {};
      var day = new Date(data.trackInfo.day);
      $scope.makeEvent._id = data.trackInfo._id;
      $scope.makeEvent.day = new Date(data.trackInfo.day);
      $scope.makeEvent.url = data.trackInfo.trackURL;
      $scope.makeEvent.trackID = data.trackInfo.trackID;
      $scope.makeEvent.comment = data.trackInfo.comment;
      $scope.makeEvent.followers = data.userInfo.followers;
      $scope.makeEvent.username = data.userInfo.username;
      if (data.trackInfo.like) $scope.likeSrc = 'assets/images/likeTrue.svg';
      else $scope.likeSrc = 'assets/images/like.svg';
      if (data.trackInfo.comment) $scope.commentSrc = 'assets/images/comment.svg';
      else $scope.commentSrc = 'assets/images/noComment.svg';
      $scope.makeEvent.artist = data.userInfo;
      var repostDate = new Date(data.trackInfo.day);
      $scope.makeEvent.unrepostHours = data.trackInfo.unrepostHours;
      $scope.playerURL = $sce.trustAsResourceUrl("https://w.soundcloud.com/player/?url=http://api.soundcloud.com/tracks/" + $scope.makeEvent.trackID + "&auto_play=false&show_artwork=false")
      document.getElementById('scPlayer').style.visibility = "visible";
    }
    $scope.backToListEvent = function() {
      $scope.itemview = "list";
    }
  }
});