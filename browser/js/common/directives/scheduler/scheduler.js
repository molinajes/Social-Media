app.directive('scheduler', function($http) {
  return {
    templateUrl: 'js/common/directives/scheduler/scheduler.html',
    restrict: 'E',
    scope: false,
    controller: function schedulerController($rootScope, $state, $scope, $http, AuthService, $window, SessionService) {
      $scope.months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var daysArray = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      $scope.currentDate = new Date();
      $scope.type = 'share';
      $scope.dateCompare = getshortdate($scope.currentDate);
      $scope.time = formatAMPM($scope.currentDate);
      $scope.user = SessionService.getUser();
      $scope.showEmailModal = false;
      $scope.makeEventURL = "";
      $scope.showPlayer = false;
      $scope.showOverlay = false;
      $scope.processiong = false;
      $scope.hideall = false;
      $scope.itemview = "calender";
      $scope.dayIncr = 7;
      $scope.listDayIncr = 0;
      $scope.eventDate = new Date();
      $scope.trackList = [];
      $scope.trackListObj = null;
      $scope.trackListSlotObj = null;
      $scope.newQueueSong = "";
      $scope.trackArtistID = 0;
      $scope.trackType = "";
      $scope.timeGap = '1';
      $scope.otherChannels = {};
      $scope.listevents = [];
      $scope.tabSelected = true;
      $scope.listAvailableSlots = [];
      $scope.openSlots = [];
      $scope.displayType = 'channel';
      $scope.paidCommentsArr = [];
      $scope.tradeCommentsArr = [];
      $scope.popup = false;
      $scope.selectedSlot = {};
      $scope.now = new Date();
      $scope.alreadyLoaded = false;
      $scope.unrepostHours = 48;
      var commentIndex = 0;
      $scope.isView = false;
      $scope.isTraded = false;
      $scope.origin = window.location.origin;
      $scope.eventComment = ($scope.user.repostSettings && $scope.user.repostSettings.schedule && $scope.user.repostSettings.schedule.comments && $scope.user.repostSettings.schedule.comments.length > 0) ? $scope.user.repostSettings.schedule.comments[Math.random() * $scope.user.repostSettings.schedule.comments.length >> 0] : '';
      var defaultAvailableSlots = {
        sunday: [],
        monday: [],
        tuesday: [],
        wednesday: [],
        thursday: [],
        friday: [],
        saturday: []
      };

      $scope.channelArr = [];
      $scope.groupArr = [];
      $scope.selectedGroups = {};
      $scope.selectedChannel = {};
      $scope.uniqueGroup = [];
      for (var i = 0; i < $scope.user.paidRepost.length; i++) {
        $scope.user.paidRepost[i].groups.forEach(function(acc) {
          if (acc != "" && $scope.uniqueGroup.indexOf(acc) === -1) {
            $scope.uniqueGroup.push(acc);
          }
        });
      }

      if (window.location.href.indexOf('scheduler#myschedule') != -1) {
        $('.nav-tabs a[href="#myschedule"]').tab('show');
      } else if (window.location.href.indexOf('scheduler#organizeschedule') != -1) {
        $('.nav-tabs a[href="#organizeschedule"]').tab('show');
      } else if (window.location.href.indexOf('scheduler#managereposts') != -1) {
        $('.nav-tabs a[href="#managereposts"]').tab('show');
      }

      $scope.setRepostHours = function() {
        if ($scope.unrepostEnable) {
          $scope.unrepostHours = "48";
        } else {
          $scope.unrepostHours = "";
        }
      }

      $scope.choseTrack1 = function(track) {
        $scope.searchString = track.title;
        $scope.makeEventURL = track.permalink_url;
        $scope.makeEvent.trackID = track.id;
        $scope.makeEvent.title = track.title;
        $scope.makeEvent.trackArtUrl = track.artwork_url;
        $scope.makeEvent.artistName = track.user.username;
        $scope.makeEvent.trackURL = track.permalink_url
        $scope.showPlayer = true;
        var playerWidget = SC.Widget('scPopupPlayer');
        playerWidget.load($scope.makeEventURL, {
          auto_play: false,
          show_artwork: false,
          callback: function() {
            document.getElementById('scPopupPlayer').style.visibility = "visible";
            if (!$scope.$$phase) $scope.$apply();
          }
        });
        $scope.warnAboutPrevRepost();
      }

      $scope.choseTrack = function(track) {
        $scope.makeEventURL = track.permalink_url;
        $scope.searchString = track.title;
        $scope.makeEvent.trackID = track.id;
        $scope.makeEvent.title = track.title;
        $scope.makeEvent.trackArtUrl = track.artwork_url;
        $scope.makeEvent.artistName = track.user.username;
        $scope.makeEvent.trackURL = track.permalink_url;
        $scope.showPlayer = true;
        var popupPlayerWidget = SC.Widget('scPlayer');
        popupPlayerWidget.load($scope.makeEventURL, {
          auto_play: false,
          show_artwork: true,
          callback: function() {
            document.getElementById('scPlayer').style.visibility = "visible";
            if (!$scope.$$phase) $scope.$apply();
          }
        });
        $scope.warnAboutPrevRepost();
      }

      $scope.warnAboutPrevRepost = function() {
        var filtered = $scope.events.filter(function(event) {
          return event.trackID == $scope.makeEvent.trackID && event.day < $scope.makeEvent.day;
        })
        filtered.sort(function(a, b) {
          return b.day - a.day;
        })
        if (filtered[0] && filtered[0].unrepostDate < filtered[0].day) {
          $.Zebra_Dialog('FYI: This song will not be reposted unless you unrepost the previous repost of this track, which is scheduled for ' + filtered[0].day.toLocaleString() + '.');
        }
      }

      $scope.linkedAccounts = [];
      /*Get Linked Accounts*/
      $scope.getLinkedAccounts = function() {
        var linked = $rootScope.userlinkedAccounts;
        for (var i = 0; i < linked.length; i++) {
          if (linked[i]._id != $scope.user._id) {
            $scope.linkedAccounts.push(linked[i]);
          }
        }
        if (!$scope.$$phase) $scope.$apply();
      }

      $scope.checkCommentEnable = function() {
        if ($scope.user.repostSettings && $scope.user.repostSettings.schedule) {
          if ($scope.user.repostSettings.schedule.comment == false) {
            $scope.disable = true;
            $scope.commentEvent = false;
            $scope.eventComment = "";
            $scope.commentSrc = 'assets/images/noComment.svg';
          } else {
            $scope.disable = false;
            $scope.commentEvent = true;
            if ($scope.slotType == 'track') {
              $scope.eventComment = ($scope.user.repostSettings && $scope.user.repostSettings.schedule && $scope.user.repostSettings.schedule.comments && $scope.user.repostSettings.schedule.comments.length > 0) ? $scope.user.repostSettings.schedule.comments[Math.random() * $scope.user.repostSettings.schedule.comments.length] : '';
            }
            $scope.commentSrc = 'assets/images/comment.svg';
          }
        }
        if ($scope.user.repostSettings && $scope.user.repostSettings.trade) {
          if ($scope.user.repostSettings.trade.comment == false) {
            $scope.disable = true;
            $scope.commentEvent = false;
            $scope.eventComment = "";
            $scope.commentSrc = 'assets/images/noComment.svg';
          } else {
            $scope.disable = false;
            $scope.commentEvent = true;
            if ($scope.slotType == 'traded') {
              $scope.eventComment = ($scope.user.repostSettings && $scope.user.repostSettings.trade && $scope.user.repostSettings.trade.comments && $scope.user.repostSettings.trade.comments.length > 0) ? $scope.user.repostSettings.trade.comments[Math.random() * $scope.user.repostSettings.trade.comments.length] : '';
            }
            $scope.commentSrc = 'assets/images/comment.svg';
          }
        }
      }

      $scope.checkLikeEnable = function() {
        if ($scope.user.repostSettings && $scope.user.repostSettings.schedule) {
          if ($scope.user.repostSettings.schedule.like == false) {
            $scope.likeSrc = 'assets/images/like.svg';
            $scope.likeEvent = false;
          } else {
            $scope.likeSrc = 'assets/images/likeTrue.svg';
            $scope.likeEvent = true;
          }
        }
      }
      $scope.changeLikeCommentIcons = function(type) {
        console.log(type);
        if (type == 'like') {
          console.log($scope.likeSrc);
          if ($scope.likeSrc == 'assets/images/like.svg') {
            $scope.likeSrc = 'assets/images/likeTrue.svg';
            $scope.likeEvent = true;
          } else {
            $scope.likeSrc = 'assets/images/like.svg';
            $scope.likeEvent = false;
          }
          console.log($scope.likeSrc)
        } else {
          console.log($scope.commentSrc);
          if ($scope.commentSrc == 'assets/images/comment.svg') {
            $scope.commentSrc = 'assets/images/noComment.svg';
            $scope.makeEvent.isComment = false;
            $scope.commentEvent = false;
            $scope.disable = true;
            $scope.eventComment = "";
          } else {
            $scope.commentSrc = 'assets/images/comment.svg';
            $scope.commentEvent = true;
            $scope.makeEvent.isComment = true;
            $scope.disable = false;
            commentIndex = 0;
            if ($scope.slotType == 'track') {
              $scope.eventComment = $scope.isComment ? $scope.isComment : ($scope.user.repostSettings.schedule.comments.length > 1 ? $scope.user.repostSettings.schedule.comments[Math.random() * $scope.user.repostSettings.schedule.comments.length >> 0] : $scope.user.repostSettings.schedule.comments[0]);
            } else {
              $scope.eventComment = $scope.isComment ? $scope.isComment : ($scope.user.repostSettings.trade.comments.length > 1 ? $scope.user.repostSettings.trade.comments[Math.random() * $scope.user.repostSettings.trade.comments.length >> 0] : $scope.user.repostSettings.trade.comments[0]);
            }
          }
        }
      }

      $scope.getPrevNextComment = function(type) {
        if (type == 'next') {
          if ($scope.slotType == 'track' && commentIndex < $scope.user.repostSettings.schedule.comments.length - 1) {
            commentIndex = commentIndex + 1;
            $scope.eventComment = $scope.user.repostSettings.schedule.comments[commentIndex];
          } else if ($scope.slotType == 'traded' && commentIndex < $scope.user.repostSettings.trade.comments.length - 1) {
            commentIndex = commentIndex + 1;
            $scope.eventComment = $scope.user.repostSettings.trade.comments[commentIndex];
          }
        } else {
          if ($scope.slotType == 'track' && commentIndex >= 1) {
            commentIndex = commentIndex - 1;
            $scope.eventComment = $scope.user.repostSettings.schedule.comments[commentIndex];
          } else if ($scope.slotType == 'traded' && commentIndex >= 1) {
            commentIndex = commentIndex - 1;
            $scope.eventComment = $scope.user.repostSettings.trade.comments[commentIndex];
          }
        }
      }

      $scope.saveRepostSettings = function() {
        $http.put('/api/database/updateRepostSettings', {
          repostSettings: $scope.user.repostSettings,
          id: $scope.user._id
        }).then(function(res) {
          console.log(res.data);
          SessionService.create(res.data);
          $scope.user = SessionService.getUser();
          $scope.checkCommentEnable();
          $scope.checkLikeEnable();
        });
      }

      $scope.deleteComment = function(commentIndex, type) {
        if (type == 'schedule') {
          $scope.user.repostSettings.schedule.comments.splice(commentIndex, 1);
        } else if (type == 'trade') {
          $scope.user.repostSettings.trade.comments.splice(commentIndex, 1);
        }
        $scope.saveRepostSettings();
      }

      $scope.saveComments = function(value, type, index) {
        var comments = [];
        if (type == 'schedule' && value) {
          comments = ($scope.user.repostSettings.schedule.comments ? $scope.user.repostSettings.schedule.comments : []);
          if (index == undefined)
            comments.push(value);
          else
            comments[index] = value;

          $scope.user.repostSettings.schedule.comments = comments;
          $scope.saveRepostSettings();
          $scope.scheduleComment = "";
        } else if (type == 'trade' && value) {
          comments = ($scope.user.repostSettings.trade.comments ? $scope.user.repostSettings.trade.comments : []);
          if (index == undefined)
            comments.push(value);
          else
            comments[index] = value;
          $scope.user.repostSettings.trade.comments = comments;
          $scope.saveRepostSettings();
          $scope.tradeComment = "";
        } else {
          $.Zebra_Dialog("Please enter comment");
          return;
        }
      }

      $scope.editComments = function(comment, type, index) {
        console.log(index);
        $scope.scheduleCommentIndex = index;
        if (type == 'schedule') {
          $('#scheduleCommentModal').modal('show');
          $scope.scheduleComment = comment;
        } else if (type == 'trade') {
          $('#tradeCommentModal').modal('show');
          $scope.tradeComment = comment;
        }
      }

      $scope.setActive = function(type) {
        $scope.displayType = type;
      }

      $scope.setChannel = function(value) {
        if ($scope.displayType == 'channel') {
          var index = $scope.channelArr.indexOf(value);
          if (index == -1) {
            $scope.channelArr.push(value);
          } else {
            $scope.channelArr.splice(index, 1);
          }
        }
        $scope.otherChannelsAndGroups();
        $scope.followersCount();
      }

      $scope.setGroup = function(value) {
        if ($scope.displayType == 'group') {
          var index = $scope.groupArr.indexOf(value);
          if (index == -1) {
            $scope.groupArr.push(value);
          } else {
            $scope.groupArr.splice(index, 1);
          }
        }
        $scope.otherChannelsAndGroups();
        $scope.followersCount();
      }

      function formatAMPM(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = (hours < 10 ? hours : hours) + ':' + minutes + ampm;
        return strTime;
      }
      $scope.pseudoAvailableSlots = (($scope.user.pseudoAvailableSlots != undefined) ? $scope.user.pseudoAvailableSlots : defaultAvailableSlots);
      $scope.setView = function(view) {
        $scope.itemview = view;
        $scope.getListEvents();
      };
      $scope.trackChange = function(index) {
        $scope.makeEventURL = $scope.trackListSlotObj.permalink_url;
        $scope.changeURL();
      };

      $scope.showTab = function() {
        $scope.tabSelected = true;
      }

      $scope.addNewSong = function() {
        $scope.isEdit = false;
        $scope.tabSelected = false;
        $scope.makeEventURL = "";
        $scope.makeEvent = {
          type: 'track'
        };
        $scope.unrepostHours = "48";
        $scope.unrepostEnable = true;
        $scope.eventComment = "";
        $scope.channelArr = [];
        $scope.selectedSlot = "";
        $scope.followersCount();
        $scope.setScheduleLikeComment();
        $scope.showPlayer = false;
        $scope.getListEvents();
        if ($scope.listAvailableSlots[0]) $scope.selectedSlot = $scope.firstSlot = JSON.stringify($scope.listAvailableSlots[0]);
        $scope.clickAvailableSlots($scope.firstSlot);
      }

      $scope.isSchedule = false;
      $scope.scheduleSong = function(date) {
        $scope.isTraded = false;
        $scope.afcount = 0;
        $scope.isEdit = false;
        $scope.isSchedule = true;
        $scope.tabSelected = false;
        $scope.isView = false;
        $scope.unrepostEnable = true;
        $scope.unrepostHours = "48";
        $scope.newEvent = true;
        $scope.showPlayer = false;
        $scope.isComment = "";
        $scope.setScheduleLikeComment();
        document.getElementById('scPlayer').style.visibility = "hidden";
        $scope.makeEvent = {
          userID: $scope.user.soundcloud.id,
          type: "track"
        };
        $scope.selectedSlot = date;
        var selectedSlot = new Date($scope.selectedSlot);
        var day = new Date(selectedSlot.getTime() - selectedSlot.getTimezoneOffset() * 60000).toISOString();
        var hour = ConvertStringTimeToUTC(selectedSlot.getHours());
        var makeDay = new Date(day);
        makeDay.setHours(hour);
        $scope.makeEvent.day = makeDay;
        $scope.selectedSlot = new Date(date);
        $scope.editChannelArr = [];
        $scope.channelArr = [];
        $scope.slotType = 'track';
      }

      $scope.isEdit = false;
      $scope.EditNewSong = function(item, editable) {
        $scope.afcount = 0;
        $scope.editChannelArr = [];
        $scope.tabSelected = false;
        $scope.isEdit = true;
        $scope.isTraded = false;
        $scope.isSchedule = false;
        $scope.deleteEventData = item;
        var newObj = angular.copy(item);
        $scope.makeEventURL = newObj.event.trackURL;
        $scope.selectedSlot = newObj.event.day;
        $scope.likeSrc = (newObj.event.like == true) ? 'assets/images/likeTrue.svg' : 'assets/images/like.svg';
        $scope.likeEvent = newObj.event.like;
        $scope.commentSrc = (newObj.event.comment != "") ? 'assets/images/comment.svg' : 'assets/images/noComment.svg';
        $scope.commentEvent = (newObj.event.comment != "" ? true : false);
        $scope.disable = !$scope.commentEvent;
        $scope.eventComment = "";
        if ($scope.commentEvent) {
          $scope.eventComment = newObj.event.comment;
          $scope.isComment = newObj.event.comment;
        }
        $scope.timeGap = newObj.event.timeGap;
        $scope.unrepostHours = newObj.event.unrepostHours;
        $scope.unrepostEnable = new Date(newObj.event.unrepostDate) > new Date(1000);
        var channels = newObj.event.otherChannels;
        if (channels.length > 0) {
          for (var i = 0; i < channels.length; i++) {
            for (var j = 0; j < $scope.linkedAccounts.length; j++) {
              if (channels[i] == $scope.linkedAccounts[j].soundcloud.id) {
                $scope.editChannelArr.push($scope.linkedAccounts[j].name);
              }
            }
          }
          $scope.channelArr = $scope.editChannelArr;
        }
        SC.Widget('scPlayer').load($scope.makeEventURL, {
          auto_play: false,
          show_artwork: true
        });
        $scope.slotType = item.event.type;
        if ($scope.slotType == "traded" || $scope.slotType == 'paid')
          $scope.isTraded = true;
        $scope.showPlayer = true;
        document.getElementById('scPlayer').style.visibility = "visible";
        if (item.event.type == 'traded' && item.event.trackURL) {
          $scope.isView = true;
        } else if (item.event.type == 'traded' && !item.event.trackURL) {
          $scope.setTradedLikeComment();
        } else if (item.event.type == 'traded' && !item.event.trackURL) {
          $scope.setTradedLikeComment();
        }
        $scope.followersCount();
        $scope.makeEvent = {};
        $scope.newEvent = false;
        var selectedSlot = $scope.selectedSlot;
        var day = new Date(selectedSlot.getTime() - selectedSlot.getTimezoneOffset() * 60000).toISOString();
        var hour = ConvertStringTimeToUTC(selectedSlot.getHours());
        var makeDay = new Date(day);
        makeDay.setHours(hour);
        $scope.makeEvent.trackID = newObj.event.trackID;
        $scope.makeEvent.day = makeDay;
        $scope.makeEvent._id = newObj.event._id;
        $scope.makeEvent.trackURL = $scope.makeEventURL;
        $scope.makeEvent.title = newObj.event.title;
        $scope.makeEvent.type = item.event.type;
        $scope.makeEvent.owner = newObj.event.owner;
      }

      $scope.addNewSongCancel = function() {
        $scope.tabSelected = true;
        $scope.makeEventURL = "";
        $scope.makeEvent = null;
        $scope.showPlayer = false;
      }

      function getshortdate(d) {
        var YYYY = d.getFullYear();
        var M = d.getMonth() + 1;
        var D = d.getDate();
        var MM = (M < 10) ? ('0' + M) : M;
        var DD = (D < 10) ? ('0' + D) : D;
        var result = MM + "/" + DD + "/" + YYYY;
        return result;
      }

      $scope.getPreviousEvents = function() {
        $scope.listDayIncr--;
        $scope.getListEvents();
      }

      $scope.getListEvents = function() {
        $scope.listevents = [];
        var currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + $scope.listDayIncr);
        for (var i = 0; i < 7; i++) {
          var d = new Date(currentDate);
          d.setDate(d.getDate() + i);
          var currentDay = parseInt(d.getDay());
          var strDdate = getshortdate(d);
          var slots = $scope.pseudoAvailableSlots[daysArray[currentDay]];
          slots = slots.sort(function(a, b) {
            return a - b
          });

          angular.forEach(slots, function(s) {
            var item = new Object();
            var h = s;
            var time = '';
            if (h >= 12) {
              h = h - 12;
              time = h + " PM";
            } else {
              time = h + " AM";
            }

            var calendarDay = $scope.calendar.find(function(calD) {
              return calD.day.toLocaleDateString() == d.toLocaleDateString();
            });
            var event = calendarDay.events.find(function(ev) {
              return new Date(ev.day).getHours() == s;
            });

            item.event = event;
            var dt = new Date(strDdate);
            dt.setHours(s);
            item.date = new Date(dt);
            if (!item.event) {
              if (new Date(item.date).getTime() > new Date().getTime()) {
                $scope.listevents.push(item);
              }
            } else if (item.event) {
              $scope.listevents.push(item);
            }
            if (event == undefined && new Date(item.date) > new Date()) {
              item.slotdate = d;
              item.slottime = time;
              $scope.listAvailableSlots.push(item);
            }
          });
        }
      }

      $scope.getNextEvents = function() {
        $scope.listDayIncr++;
        $scope.getListEvents();
      }

      $scope.getNextDayOfWeek = function() {
        var thisDay = new Date();
        for (var i = 0; i < 7; i++) {
          thisDay.setDate(thisDay.getDate() + 1);
        }
      }

      $scope.toggleAvailableSlot = function(day, hour) {
        var pushhour = parseInt(hour);
        if ($scope.pseudoAvailableSlots[daysArray[day]].indexOf(pushhour) > -1) {
          if ($scope.pseudoAvailableSlots[daysArray[day]].length <= 2) {
            $.Zebra_Dialog("Cannot remove slot. You must have at least 2 repost slots per day.");
          } else {
            $scope.pseudoAvailableSlots[daysArray[day]].splice($scope.pseudoAvailableSlots[daysArray[day]].indexOf(pushhour), 1);
          }
        } else if ($scope.tooManyReposts(day, hour)) {
          $.Zebra_Dialog("Cannot schedule slot. We only allow 12 reposts within 24 hours to prevent you from being repost blocked.");
          return;
        } else {
          $scope.pseudoAvailableSlots[daysArray[day]].push(pushhour);
        }
        $scope.user.availableSlots = createAvailableSlots($scope.user, $scope.pseudoAvailableSlots);
        $http.post('/api/events/saveAvailableSlots', {
          availableslots: $scope.user.availableSlots,
          id: $scope.user._id
        }).then(function(res) {
          SessionService.create(res.data);
          $scope.user = SessionService.getUser();
        }).then(null, console.log);
      }

      $scope.tooManyReposts = function(day, hour) {
        var startDayInt = (day + 6) % 7;
        var allSlots = []
        var wouldBeSlots = JSON.parse(JSON.stringify($scope.pseudoAvailableSlots));
        wouldBeSlots[daysArray[day]].push(hour);
        for (var i = 0; i < 3; i++) {
          wouldBeSlots[daysArray[(startDayInt + i) % 7]]
            .forEach(function(slot) {
              allSlots.push(slot + i * 24);
            })
        }
        allSlots = allSlots.sort(function(a, b) {
          return a - b;
        })
        var checkingSlots = [];
        var status = false;
        allSlots.forEach(function(slot) {
          var i = 0;
          while (i < checkingSlots.length) {
            if (Math.abs(checkingSlots[i] - slot) >= 24) checkingSlots.splice(i, 1);
            else i++;
          }
          checkingSlots.push(slot);
          if (checkingSlots.length > 12) {
            status = true;
          }
        })
        return status;
      }

      $scope.setSlotStyle = function(day, hour) {
        var style = {
          'border-radius': '4px'
        };
        if ($scope.pseudoAvailableSlots && $scope.pseudoAvailableSlots[daysArray[day]].indexOf(hour) > -1) {
          style = {
            'background-color': "#fff",
            'border-color': "#999",
            'border-radius': '4px',
          };
        }
        return style;
      }

      $scope.getChannels = function() {
        $scope.channels = ["Emil", "Tobias", "Linus"];
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
              if (!$scope.$$phase) $scope.$apply();
            })
            .catch(function(response) {
              $scope.processing = false;
              if (!$scope.$$phase) $scope.$apply();
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
          })
          .then(null, function(err) {
            $.Zebra_Dialog("Error: did not save");
            $scope.processing = false;
          });
      }

      $scope.incrDay = function() {
        if ($scope.dayIncr < 42) $scope.dayIncr++;
      }

      $scope.decrDay = function() {
        if ($scope.dayIncr > 0) $scope.dayIncr--;
      }

      function ConvertStringTimeToUTC(strTime) {
        var time = String(strTime);
        var hours = Number(time.split(':')[0]);
        var AMPM = time.split(' ')[1];
        if (AMPM === "PM" && hours < 12) {
          hours = hours + 12
        }
        if (AMPM === "AM" && hours === 12) {
          hours = hours - 12
        }
        var sHours = hours.toString();
        if (hours < 10) {
          sHours = "0" + sHours
        }
        return sHours;
      }

      $scope.clickAvailableSlots = function(selectedSlot) {
        selectedSlot = JSON.parse(selectedSlot);
        var day = new Date(selectedSlot.slotdate);
        var hour = ConvertStringTimeToUTC(selectedSlot.slottime);
        var calDay = {};
        var calendarDay = $scope.calendar.find(function(calD) {
          return calD.day.toLocaleDateString() == day.toLocaleDateString();
        });
        if (!$scope.makeEvent) {
          $scope.makeEvent = {
            userID: $scope.user.soundcloud.id,
            type: "track"
          };
        }
        $scope.newEvent = true;
        var makeDay = new Date(selectedSlot.slotdate);
        makeDay.setHours(hour);
        $scope.makeEvent.day = makeDay;
        $scope.makeEventURL = $scope.makeEvent.trackURL;
      }

      $scope.populateOpenSlots = function() {
        $scope.openSlots = [];
        var currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + $scope.listDayIncr);
        for (var i = 0; i < 7; i++) {
          var d = new Date(currentDate);
          d.setDate(d.getDate() + i);
          var currentDay = parseInt(d.getDay());
          var strDdate = getshortdate(d);
          var slots = $scope.pseudoAvailableSlots[daysArray[currentDay]];
          slots = slots.sort(function(a, b) {
            return a - b
          });

          angular.forEach(slots, function(s) {
            var item = new Object();
            var h = s;
            var time = '';
            if (h >= 12) {
              h = h - 12;
              time = h + " PM";
            } else {
              time = h + " AM";
            }

            var calendarDay = $scope.calendar.find(function(calD) {
              return calD.day.toLocaleDateString() == d.toLocaleDateString();
            });
            var event = calendarDay.events.find(function(ev) {
              return new Date(ev.day).getHours() == s;
            });

            item.event = event;
            var dt = new Date(strDdate);
            dt.setHours(s);
            item.date = new Date(dt);
            if (!item.event) {
              if (new Date(item.date).getTime() > new Date().getTime()) {
                $scope.listevents.push(item);
              }
            } else if (item.event) {
              $scope.listevents.push(item);
            }
            if (event == undefined && new Date(item.date) > new Date()) {
              item.slotdate = d;
              item.slottime = time;
              var newDate = new Date(item.date);
              newDate.setMinutes(30);
              $scope.openSlots.push(newDate);
            }
          });
        }
      }

      $scope.makeEventDayChange = function() {
        $scope.makeEvent.day = new Date(parseInt($scope.makeEventDay));
      }

      $scope.clickedSlot = function(day, hour, data) {
        $scope.afcount = 0;
        $scope.isView = false;
        $scope.popup = true;
        $scope.slotType = 'track';
        var d = new Date(day).getDay();
        if ($scope.pseudoAvailableSlots[daysArray[d]].indexOf(hour) == -1 && data.type == 'empty') return;
        var makeDay = new Date(day);
        makeDay.setHours(hour);
        if ($scope.user.blockRelease && new Date($scope.user.blockRelease).getTime() > new Date(makeDay).getTime()) {
          $.Zebra_Dialog("Sorry! You are blocked till date " + moment($scope.user.blockRelease).format('LLL'));
          return;
        }
        $scope.showOverlay = true;
        var calDay = {};
        var calendarDay = $scope.calendar.find(function(calD) {
          return calD.day.toLocaleDateString() == day.toLocaleDateString();
        });
        $scope.makeEventURL = "";
        $scope.trackListSlotObj = undefined;
        $scope.makeEvent = JSON.parse(JSON.stringify(calendarDay.events[hour]));
        $scope.unrepostEnable = new Date($scope.makeEvent.unrepostDate) > new Date(1000);
        $scope.unrepostHours = "";
        $scope.updateReach();
        $scope.setScheduleLikeComment();
        if ($scope.makeEvent.type == "empty") {
          makeDay = new Date(day);
          makeDay.setHours(hour);
          $scope.makeEvent = {
            userID: $scope.user.soundcloud.id,
            day: makeDay,
            type: "track"
          };
          $scope.channelArr = [];
          $scope.isEdit = false;
          $scope.isTraded = false;
          if ($scope.commentEvent == true)
            $scope.eventComment = ($scope.user.repostSettings && $scope.user.repostSettings.schedule && $scope.user.repostSettings.schedule.comments && $scope.user.repostSettings.schedule.comments.length > 0) ? $scope.user.repostSettings.schedule.comments[Math.random() * $scope.user.repostSettings.schedule.comments.length >> 0] : '';
          $scope.isComment = "";
          document.getElementById('scPopupPlayer').style.visibility = "hidden";
          $scope.showPlayer = false;
          $scope.makeEvent.day = new Date($scope.makeEvent.day);
          $scope.makeEventDay = JSON.stringify($scope.makeEvent.day.getTime());
          $scope.makeEvent.unrepostDate = new Date($scope.makeEvent.day.getTime() + 24 * 60 * 60 * 1000);
          $scope.unrepostEnable = true;
          $scope.unrepostHours = "48";
          $scope.makeEvent.unrepost = true;
          $scope.newEvent = true;
          $scope.editChannelArr = [];
          $scope.channelArr = [];
          $scope.makeEvent.hoursBetween = 1;
        } else {
          if (data.type == 'traded' || data.type == 'paid') $scope.isTraded = true;
          $scope.isEdit = true;
          $scope.likeSrc = (data.like == true) ? 'assets/images/likeTrue.svg' : 'assets/images/like.svg';
          $scope.likeEvent = data.like;
          $scope.commentSrc = (data.comment != "") ? 'assets/images/comment.svg' : 'assets/images/noComment.svg';
          $scope.commentEvent = (data.comment != "" ? true : false);
          if ($scope.commentEvent == false) {
            $scope.eventComment = "";
          }
          $scope.disable = ($scope.commentEvent == true) ? false : true;

          $scope.editChannelArr = [];
          $scope.channelArr = [];
          var channels = data.otherChannels;
          if (channels.length > 0) {
            for (var i = 0; i < channels.length; i++) {
              for (var j = 0; j < $scope.linkedAccounts.length; j++) {
                if (channels[i] == $scope.linkedAccounts[j].soundcloud.id) {
                  $scope.editChannelArr.push($scope.linkedAccounts[j].name);
                }
              }
            }
            $scope.channelArr = $scope.editChannelArr;
          }
          $scope.timeGap = data.timeGap;
          $scope.followersCount();
          var repostDate = new Date($scope.makeEvent.day);
          var unrepostDate = new Date($scope.makeEvent.unrepostDate);
          var diff = Math.abs(new Date(unrepostDate).getTime() - new Date(repostDate).getTime()) / 3600000;
          $scope.makeEvent.unrepostHours = diff;
          $scope.unrepostHours = data.unrepostHours;
          $scope.makeEvent.day = new Date($scope.makeEvent.day);
          $scope.makeEventDay = JSON.stringify($scope.makeEvent.day.getTime());
          $scope.makeEvent.unrepostDate = new Date($scope.makeEvent.unrepostDate);
          $scope.makeEvent.unrepost = ($scope.makeEvent.unrepostDate > new Date());
          $scope.makeEventURL = $scope.makeEvent.trackURL;
          $scope.makeEvent.trackID = data.trackID;
          $scope.makeEvent.hoursBetween = 1;
          $scope.newEvent = false;
          SC.Widget('scPopupPlayer').load($scope.makeEventURL, {
            auto_play: false,
            show_artwork: false
          });
          $scope.showPlayer = true;
          document.getElementById('scPopupPlayer').style.visibility = "visible";
          if (data.type == 'traded' && data.trackURL) {
            $scope.slotType = 'traded';
            $scope.isView = true;
            $scope.eventComment = "";
            $scope.isComment = "";
            if ($scope.commentEvent) {
              $scope.eventComment = $scope.makeEvent.comment;
              $scope.isComment = $scope.makeEvent.comment;
            }
          } else
          if (data.type != 'traded' && data.trackURL) {
            $scope.slotType = 'track';
            $scope.showPlayer = true;
            if ($scope.commentEvent)
              $scope.eventComment = $scope.makeEvent.comment;
            $scope.isComment = $scope.makeEvent.comment;
          } else
          if (data.type == 'traded' && !data.trackURL) {
            $scope.setTradedLikeComment();
            $scope.slotType = 'traded';
            $scope.showPlayer = false;
          }
        }
        console.log($scope.makeEvent.day);
        $scope.populateOpenSlots();
      }

      $scope.setScheduleLikeComment = function() {
        if ($scope.user.repostSettings && $scope.user.repostSettings.schedule) {
          if ($scope.user.repostSettings.schedule.like == false) {
            $scope.likeSrc = 'assets/images/like.svg';
            $scope.likeEvent = false;
          } else {
            $scope.likeSrc = 'assets/images/likeTrue.svg';
            $scope.likeEvent = true;
          }
        }

        if ($scope.user.repostSettings && $scope.user.repostSettings.schedule && $scope.user.repostSettings.schedule.comment == false) {
          $scope.disable = true;
          $scope.commentEvent = false;
          $scope.eventComment = "";
          $scope.commentSrc = 'assets/images/noComment.svg';
        } else {
          $scope.disable = false;
          $scope.commentEvent = true;
          $scope.eventComment = ($scope.user.repostSettings && $scope.user.repostSettings.schedule && $scope.user.repostSettings.schedule.comments && $scope.user.repostSettings.schedule.comments.length > 0) ? $scope.user.repostSettings.schedule.comments[Math.random() * $scope.user.repostSettings.schedule.comments.length >> 0] : '';
          $scope.commentSrc = 'assets/images/comment.svg';
        }
      }

      $scope.setTradedLikeComment = function() {
        if ($scope.user.repostSettings && $scope.user.repostSettings.trade) {
          if ($scope.user.repostSettings.trade.like == false) {
            $scope.likeSrc = 'assets/images/like.svg';
            $scope.likeEvent = false;
          } else {
            $scope.likeSrc = 'assets/images/likeTrue.svg';
            $scope.likeEvent = true;
          }
        }

        if ($scope.user.repostSettings && $scope.user.repostSettings.trade && $scope.user.repostSettings.trade.comment == false) {
          $scope.disable = true;
          $scope.commentEvent = false;
          $scope.eventComment = "";
          $scope.commentSrc = 'assets/images/noComment.svg';
        } else {
          $scope.disable = false;
          $scope.commentEvent = true;
          $scope.eventComment = ($scope.user.repostSettings && $scope.user.repostSettings.trade && $scope.user.repostSettings.trade.comments && $scope.user.repostSettings.trade.comments.length > 0) ? $scope.user.repostSettings.trade.comments[Math.random() * $scope.user.repostSettings.trade.comments.length >> 0] : '';
          $scope.commentSrc = 'assets/images/comment.svg';
        }
      }

      $scope.changeQueueSlot = function() {
        $scope.makeEvent.title = null;
        $scope.makeEvent.trackURL = null;
        $scope.makeEvent.artistName = null;
        $scope.makeEvent.trackID = null;
        $scope.makeEventURL = null;
      }

      $scope.log = function() {
        console.log($scope.otherChannels);
      }

      $scope.deleteEvent = function() {
        if (!$scope.newEvent) {
          $scope.processing = true;
          $http.delete('/api/events/repostEvents/' + $scope.makeEvent._id)
            .then(function(res) {
              return $scope.refreshEvents();
            })
            .then(function(res) {
              $scope.showOverlay = false;
              $scope.processing = false;
              $scope.showPlayer = false;
              $state.reload();
            })
            .then(null, function(err) {
              $scope.processing = false;
              $.Zebra_Dialog("ERROR: Did not delete.")
            });
        } else {
          var calendarDay = $scope.calendar.find(function(calD) {
            return calD.day.toLocaleDateString() == $scope.makeEvent.day.toLocaleDateString();
          });
          calendarDay.events[$scope.makeEvent.day.getHours()] = {
            type: "empty"
          };
          $scope.showOverlay = false;
        }
      }

      $scope.setCalendarEvent = function(event) {
        event.day = new Date(event.day);
        var calendarDay = $scope.calendar.find(function(calD) {
          return calD.day.toLocaleDateString() == event.day.toLocaleDateString();
        });
        calendarDay.events[event.day.getHours()] = event;
      }

      $scope.findUnrepostOverlap = function() {
        if (!$scope.makeEvent.trackID) return false;
        var blockEvents = $scope.events.filter(function(event) {
          if (event._id == $scope.makeEvent._id || $scope.makeEvent.trackID != event.trackID) return false;
          event.day = new Date(event.day);
          event.unrepostDate = new Date(event.unrepostDate);
          var eventLowerBound = $scope.makeEvent.day.getTime();
          var eventUpperBound = $scope.makeEvent.unrepostDate > $scope.makeEvent.day ? $scope.makeEvent.unrepostDate.getTime() + 24 * 3600000 : $scope.makeEvent.day.getTime() + 48 * 3600000;
          var makeEventLowerBound = event.day.getTime();
          var makeEventUpperBound = event.unrepostDate > event.day ? event.unrepostDate.getTime() + 24 * 3600000 : event.day.getTime() + 48 * 3600000;
          return ((event.day.getTime() > eventLowerBound && event.day.getTime() < eventUpperBound) || ($scope.makeEvent.day.getTime() > makeEventLowerBound && $scope.makeEvent.day.getTime() < makeEventUpperBound));
        })
        return blockEvents.length > 0;
      }

      $scope.otherChannelsAndGroups = function() {
        $scope.selectedGroupChannelIDS = [];
        if ($scope.role == 'admin') {
          $scope.groupAndChannel = $scope.channelArr.concat($scope.groupArr);
          $scope.groupAndChannel.forEach(function(g) {
            $scope.user.paidRepost.forEach(function(acc) {
              if (acc.groups.indexOf(g) != -1) {
                if ($scope.selectedGroupChannelIDS.indexOf(acc.id) == -1) {
                  $scope.selectedGroupChannelIDS.push(acc.id);
                }
              } else {
                if (acc.username == g) {
                  if ($scope.selectedGroupChannelIDS.indexOf(acc.id) == -1) {
                    $scope.selectedGroupChannelIDS.push(acc.id);
                  }
                }
              }
            });
          });
          return $scope.selectedGroupChannelIDS;
        } else {
          $scope.channelArr.forEach(function(ch) {
            $scope.linkedAccounts.forEach(function(acc) {
              if (acc.soundcloud && acc.soundcloud.username == ch) {
                if ($scope.selectedGroupChannelIDS.indexOf(acc.soundcloud.id) == -1) {
                  $scope.selectedGroupChannelIDS.push(acc.soundcloud.id);
                }
              }
            });
          });
          return $scope.selectedGroupChannelIDS;
        }
      }

      $scope.saveEvent = function() {
        var otherChannels = $scope.otherChannelsAndGroups();
        if (otherChannels.length > 0) {
          $scope.makeEvent.otherChannels = otherChannels;
        } else {
          $scope.makeEvent.otherChannels = [];
        }
        if ($scope.unrepostEnable) {
          $scope.makeEvent.unrepostDate = new Date($scope.makeEvent.day.getTime() + (parseInt($scope.unrepostHours) * 60 * 60 * 1000));
          $scope.makeEvent.unrepost = true;
        } else {
          $scope.makeEvent.unrepostDate = new Date(0);
          $scope.makeEvent.unrepost = false;
        }
        $scope.makeEvent.userID = $scope.user.soundcloud.id;
        $scope.makeEvent.like = $scope.likeEvent;
        console.log($scope.kind + "rascal scope.kind");
        $scope.makeEvent.unrepostHours = $scope.unrepostHours;
        $scope.makeEvent.timeGap = $scope.timeGap;
        $scope.makeEvent.comment = ($scope.commentEvent == true ? $scope.eventComment : '');
        $scope.makeEvent.type = $window.localStorage.getItem('reposttype')
        console.log($scope.makeEvent.type + "rascal trackType");
        /*
        if ($scope.trackType == "playlist") {
          console.log("rascal playlist sorry");
          $.Zebra_Dialog("Sorry! We don't currently allow playlist reposting. Please enter a track url instead.");
          return;
        } else*/
         if ($scope.trackArtistID == $scope.user.soundcloud.id) {
          $.Zebra_Dialog("Sorry! You cannot schedule your own track to be reposted.")
          return;
        }
        /* else if ($scope.findUnrepostOverlap()) {
          $.Zebra_Dialog('Issue! Please allow at least 24 hours between unreposting a track and re-reposting it and at least 48 hours between reposts of the same track.');
          return;
        }*/
        if (!$scope.makeEvent.trackID && ($scope.makeEvent.type == "track")) {
          $.Zebra_Dialog("Pleae add a track.");
        } else {
          $scope.processing = true;
          if ($scope.newEvent) {
            for (var key in $scope.otherChannels) {
              if ($scope.otherChannels[key]) $scope.makeEvent.otherChannels.push(key);
            }
            $scope.makeEvent.timeGap = parseInt($scope.timeGap);
            var req = $http.post('/api/events/repostEventsScheduler', $scope.makeEvent)
            $scope.otherChannels = [];
            $scope.timeGap = '1';
          } else {
            var req = $http.put('/api/events/repostEvents', $scope.makeEvent);
          }
          req
            .then(function(res) {
              if (res) {
                $scope.repostResponse = res.data;
                $scope.repostResponse.user = $scope.user;
                $('#pop').modal('show');
              }
              $scope.makeEventURL = "";
              $scope.makeEvent = null;
              $scope.eventComment = "";
              $scope.unrepostEnable = false;
              document.getElementById('scPlayer').style.visibility = "hidden";
              document.getElementById('scPopupPlayer').style.visibility = "hidden";
              $scope.unrepostHours = 1;
              $scope.tabSelected = true;
              $scope.trackType = "";
              $scope.trackArtistID = 0;
              return $scope.refreshEvents();
            })
            .then(function(res) {
              if (res) {
                $scope.repostResponse = res.data;
                $scope.repostResponse.user = $scope.user;
                $('#pop').modal('show');
              }
              $scope.makeEventURL = "";
              $scope.makeEvent = null;
              $scope.eventComment = "";
              $scope.unrepostEnable = false;
              document.getElementById('scPlayer').style.visibility = "hidden";
              document.getElementById('scPopupPlayer').style.visibility = "hidden";
              $scope.unrepostHours = 1;
              $scope.tabSelected = true;
              $scope.showOverlay = false;
              $scope.processing = false;
              $scope.trackType = "";
              $scope.trackArtistID = 0;
              $scope.refreshEvents();
            })
            .then(null, function(err) {
              $scope.processing = false;
              $.Zebra_Dialog("ERROR: Did not save.");
            });
        }
      }

      $scope.emailSlot = function() {
        var mailto_link = "mailto:?subject=Repost of " + $scope.makeEvent.title + '&body=Hey,\n\n I am reposting your song ' + $scope.makeEvent.title + ' on ' + $scope.user.soundcloud.username + ' on ' + $scope.makeEvent.day.toLocaleDateString() + '.\n\n Best, \n' + $scope.user.soundcloud.username;
        location.href = encodeURI(mailto_link);
      }

      $scope.backEvent = function() {
        $scope.makeEvent = null;
        $scope.trackType = "";
        $scope.trackArtistID = 0;
        $scope.showOverlay = false;
        $scope.unrepostEnable = false;
        $scope.unrepostHours = "";
        $scope.showPlayer = false;
      }

      $scope.dayOfWeekAsString = function(date) {
        var dayIndex = date.getDay();
        if (screen.width > '744') {
          return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex];
        }
        return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dayIndex];
      }

      $scope.unrepostSymbol = function(event) {
        if (!event.unrepostDate) return;
        event.unrepostDate = new Date(event.unrepostDate);
        return event.unrepostDate > new Date();
      }

      $scope.getStyle = function(event, date, day, hour) {
        var style = {
          'border-radius': '4px'
        };
        var currentDay = new Date(date).getDay();

        var date = (new Date(date)).setHours(hour)
        if ($scope.pseudoAvailableSlots[daysArray[currentDay]] && $scope.pseudoAvailableSlots[daysArray[currentDay]].indexOf(hour) > -1 && date > (new Date())) {
          style = {
            'background-color': '#fff',
            'border-color': "#999",
            'border-radius': '4px'
          }
        }
        return style;
      }

      $scope.getEventStyle = function(event) {
        if (event.type == 'empty') {
          return {}
        } else if (event.type == 'track' || event.type == 'queue') {
          return {
            'background-color': '#FF7676',
            'margin': '2px',
            'height': '18px',
            'border-radius': '4px'
          }
        } else if (event.type == 'traded') {
          return {
            'background-color': '#FFD450',
            'margin': '2px',
            'height': '18px',
            'border-radius': '4px'
          }
        } else if (event.type == 'paid') {
          return {
            'background-color': '#FFBBDD',
            'margin': '2px',
            'height': '18px',
            'border-radius': '4px'
          }
        }
      }

      $scope.refreshEvents = function() {
        return $http.get('/api/events/forUser/' + SessionService.getUser().soundcloud.id)
          .then(function(res) {
            var events = res.data
            events.forEach(function(ev) {
              ev.day = new Date(ev.day);
              ev.unrepostDate = ev.unrepostDate ? new Date(ev.unrepostDate) : new Date(0);
            });
            $scope.events = events;
            $scope.calendar = $scope.fillDateArrays(events);
            $scope.getListEvents();

          })
      }

      $scope.fillDateArrays = function(events) {
        var calendar = [];
        var today = new Date();
        today.setDate(today.getDate() - 7);
        for (var i = 0; i < 49; i++) {
          var calDay = {};
          calDay.day = new Date(today);
          calDay.day.setDate(today.getDate() + i);
          var dayEvents = $scope.events.filter(function(ev) {
            return (ev.day.toLocaleDateString() == calDay.day.toLocaleDateString());
          });
          var eventArray = [];
          for (var j = 0; j < 24; j++) {
            eventArray[j] = {
              type: "empty"
            };
          }

          dayEvents.forEach(function(ev) {
            eventArray[ev.day.getHours()] = ev;
          });
          calDay.events = eventArray;
          calendar.push(calDay);
        }
        return calendar;
      };

      $scope.calendar = $scope.fillDateArrays($scope.events);

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

      $scope.updateReach = function() {
        $scope.repostReach = 0;
        $scope.repostReach = $scope.user.soundcloud.followers;
        for (var key in $scope.otherChannels) {
          if ($scope.otherChannels[key]) {
            var acct = $rootScope.userlinkedAccounts.find(function(acct) {
              return acct.soundcloud.id == key;
            })
            $scope.repostReach += acct.soundcloud.followers;
          }
        }
      }

      $scope.followersCount = function() {
        var count = $scope.user.soundcloud.followers;
        var channels = $scope.otherChannelsAndGroups();
        if ($scope.role == 'admin') {
          for (var i = 0; i < $scope.user.paidRepost.length; i++) {
            if (channels.indexOf($scope.user.paidRepost[i].id) > -1) {
              count = count + $scope.user.paidRepost[i].followers;
            }
          }
        } else {
          for (var i = 0; i < $scope.linkedAccounts.length; i++) {
            if (channels.indexOf($scope.linkedAccounts[i].soundcloud.id) > -1) {
              count = count + $scope.linkedAccounts[i].soundcloud.followers;
            }
          }
        }
        $scope.followCounts = count;
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
              if (!$scope.$$phase) $scope.$apply();
            })
            .catch(function(response) {
              $scope.processing = false;
              if (!$scope.$$phase) $scope.$apply();
            });
        }
      }

      $scope.shareEvent = function() {
        $scope.repostResponse = $scope.makeEvent;
        $scope.repostResponse.user = $scope.user;
        $('#pop').modal('show');
      }

      $scope.getUserNetwork()
        .then(function() {
          $scope.getLinkedAccounts();
        });
      $scope.followersCount();
      $scope.checkCommentEnable();
      $scope.checkLikeEnable();
      $scope.updateReach();
      $scope.verifyBrowser();
    }
  }
})
