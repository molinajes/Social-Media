app.directive('reforrelists', function($http) {
  return {
    templateUrl: 'js/common/directives/reForReLists/reForReLists.html',
    restrict: 'E',
    scope: false,
    controller: function rfrListsController($scope, $rootScope, $http, SessionService, $state, $timeout, $window) {
      $scope.state = 'reForReInteraction';
      $scope.activeTab = ($window.localStorage.getItem('activetab') ? $window.localStorage.getItem('activetab') : '1');
      $scope.user = SessionService.getUser();
      $rootScope.userlinkedAccounts = ($scope.user.linkedAccounts ? $scope.user.linkedAccounts : []);
      $scope.otherUsers = [];
      $scope.type = 'remind';
      $scope.listDayIncr = 0;
      $scope.now = new Date();
      var path = window.location.pathname;
      $scope.isAdminRoute = false;
      if (path.indexOf("admin/") != -1) {
        $scope.isAdminRoute = true
      } else {
        $scope.isAdminRoute = false;
      }
      $scope.itemview = "calendar";
      $scope.manageView = "calendar";
      if ($scope.activeTab == "3") {
        $window.localStorage.setItem('activetab', '1');
      }

      if (window.location.href.indexOf('artistTools/reForReLists#organizeschedule') != -1) {
        $scope.activeTab = "2";
      } else
      if (window.location.href.indexOf('artistTools/reForReLists#managetrades') != -1) {
        $scope.activeTab = "3";
      }

      $scope.currentTab = "SearchTrade";
      $scope.searchURL = "";
      $scope.sliderSearchMin = Math.log((($scope.user.soundcloud.followers) ? parseInt($scope.user.soundcloud.followers / 2) : 0)) / Math.log(1.1);
      $scope.sliderSearchMax = Math.log((($scope.user.soundcloud.followers) ? parseInt($scope.user.soundcloud.followers * 1.2) : 200000000)) / Math.log(1.1);
      $scope.minSearchTradefollowers = Math.pow(1.1, $scope.sliderSearchMin);
      $scope.maxSearchTradefollowers = Math.pow(1.1, $scope.sliderSearchMax);
      $scope.sliderManageMin = 0;
      $scope.sliderManageMax = 200000000;

      $scope.minManageTradefollowers = Math.pow(1.1, $scope.sliderManageMin);
      $scope.maxManageTradefollowers = Math.pow(1.1, $scope.sliderManageMax);
      $scope.$watch(function() {
        return $scope.sliderSearchMin
      }, function(newVal, oldVal) {
        $scope.minSearchTradefollowers = Math.pow(1.1, newVal)
      })
      $scope.$watch(function() {
        return $scope.sliderSearchMax
      }, function(newVal, oldVal) {
        $scope.maxSearchTradefollowers = Math.pow(1.1, newVal);
      })

      $scope.$watch(function() {
        return $scope.sliderManageMin
      }, function(newVal, oldVal) {
        $scope.minManageTradefollowers = Math.pow(1.1, newVal)
      })
      $scope.$watch(function() {
        return $scope.sliderManageMax
      }, function(newVal, oldVal) {
        $scope.maxManageTradefollowers = Math.pow(1.1, newVal);
      })

      $scope.sortby = "Recent Alert";
      $scope.sort_order = "ascending";
      var searchTradeRange = {
        skip: 0,
        limit: 12
      }

      $scope.dayIncr = 0;
      $scope.incrDay = function() {
        if ($scope.dayIncr < 21) $scope.dayIncr++;
      }
      $scope.decrDay = function() {
        if ($scope.dayIncr > 0) $scope.dayIncr--;
      }
      $scope.currentDate = new Date();
      var daysArray = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      $scope.searchByFollowers = function() {
        $scope.searchURL = "";
        $scope.sendSearch();
      }

      $scope.viewSoundcloud = function(user) {
        window.location.href = user.soundcloud.permalinkURL;
      }

      $scope.sendSearch = function() {
        $scope.processing = true;
        $scope.searchUser = [];
        $http.post('/api/users/bySCURL/', {
            url: $scope.searchURL,
            minFollower: $scope.minSearchTradefollowers,
            maxFollower: $scope.maxSearchTradefollowers,
            recordRange: {
              skip: 0,
              limit: 12
            }
          })
          .then(function(res) {
            $scope.processing = false;
            $scope.searchUser = res.data;
          })
          .then(undefined, function(err) {
            $scope.success = false;
            $scope.processing = false;
            $scope.searchUser = [];
            $.Zebra_Dialog("Please enter Artist url.");
          })
          .then(null, function(err) {
            $scope.success = false;
            $scope.processing = false;
            $scope.searchUser = [];
            $.Zebra_Dialog("Did not find user.");
          });
      }

      $scope.hello = function(obj) {
        $state.go('reForReInteraction', obj);
      }

      $scope.editRepostEvent = function(item) {
        $scope.afcount = 0;
        $scope.makeEvent = {};
        $scope.deleteEventData = item;
        $scope.manageView = "newsong";
        $scope.editChannelArr = [];
        var newObj = angular.copy(item);
        $scope.makeEventURL = newObj.trackInfo.trackURL;
        $scope.selectedSlot = newObj.trackInfo.day;
        $scope.makeEvent.unrepostHours = newObj.trackInfo.unrepostHours;
        $scope.unrepostEnable = newObj.trackInfo.unrepostHours ? true : false;
        var channels = newObj.trackInfo.otherChannels;
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
        if (item.trackInfo.type == 'traded' && item.trackInfo.trackURL) {
          document.getElementById('scPlayer').style.visibility = "visible";
          $scope.showPlayer = true;
        }
        $scope.newEvent = false;
        $scope.makeEvent.day = $scope.selectedSlot;
        $scope.makeEvent.userID = newObj.trackInfo.userID;
        $scope.makeEvent.owner = newObj.trackInfo.owner;
        $scope.makeEvent._id = newObj.trackInfo._id;
        $scope.makeEvent.trackURL = $scope.makeEventURL;
        $scope.makeEvent.title = newObj.trackInfo.title;
        $scope.makeEvent.trackID = newObj.trackInfo.trackID;
        $scope.makeEvent.artistName = newObj.trackInfo.artistName;
      }

      $scope.searchCurrentTrade = function() {
        var cTrades = [];
        $scope.currentTrades = [];
        angular.forEach($scope.currentTradesCopy, function(trade) {
          if ($scope.searchURL != "") {
            var url = $scope.searchURL;
            url = url.toString().replace('http://', '').replace('https://', '');
            if ((trade.other.user.soundcloud.permalinkURL.indexOf(url) != -1)) {
              cTrades.push(trade);
            }
          } else if (parseInt($scope.maxManageTradefollowers) > 0) {
            if (trade.other.user.soundcloud.followers >= $scope.minManageTradefollowers && trade.other.user.soundcloud.followers <= $scope.maxManageTradefollowers) {
              cTrades.push(trade);
            }
          }
        });
        $scope.currentTrades = cTrades;
        console.log($scope.currentTrades);
        if (!$scope.$$phase) $scope.$apply();
      }

      $scope.tradeType = {
        Requests: true,
        Requested: true,
        TradePartners: true
      };

      $scope.filterByTradeType = function() {
        $scope.processing = true;
        var tradeType = $scope.tradeType;
        tradeType = JSON.stringify(tradeType);
        $http.get('/api/trades/withUser/' + $scope.user._id + '?tradeType=' + tradeType)
          .then(function(res) {
            var trades = res.data;
            console.log(trades);
            $scope.currentTrades = [];
            trades.forEach(function(trade) {
              trade.other = (trade.p1.user._id == $scope.user._id) ? trade.p2 : trade.p1;
              trade.user = (trade.p1.user._id == $scope.user._id) ? trade.p1 : trade.p2;
            });
            $scope.currentTrades = trades;
            console.log($scope.currentTrades);
            $scope.processing = false;
          })
      }
      $scope.sortResult = function(sortby) {
        $scope.sortby = sortby;
        var sort_order = $scope.sort_order;
        if (sortby == "Followers") {
          if (sort_order == "ascending") {
            $scope.currentTrades.sort(function(a, b) {
              return b.other.user.soundcloud.followers - a.other.user.soundcloud.followers;
            })
            $scope.sort_order = "descending";
          } else {
            $scope.currentTrades.sort(function(a, b) {
              return a.other.user.soundcloud.followers - b.other.user.soundcloud.followers;
            })
            $scope.sort_order = "ascending";
          }
        } else if (sortby == "Unfilled Slots") {
          if (sort_order == "ascending") {
            $scope.currentTrades.sort(function(a, b) {
              return b.unfilledTrackCount - a.unfilledTrackCount;
            })
            $scope.sort_order = "descending";
          } else {
            $scope.currentTrades.sort(function(a, b) {
              return a.unfilledTrackCount - b.unfilledTrackCount;
            })
            $scope.sort_order = "ascending";
          }
        } else {
          if (sort_order == "ascending") {
            $scope.currentTrades.sort(function(a, b) {
              return a.other.alert.toLowerCase() < b.other.alert.toLowerCase();
            });
            $scope.sort_order = "descending";
          } else {
            $scope.currentTrades.sort(function(a, b) {
              return a.other.alert.toLowerCase() > b.other.alert.toLowerCase();
            });
            $scope.sort_order = "ascending";
          }
        }
      }

      $scope.setView = function(type) {
        $scope.itemView = type;
        $scope.shownTrades = $scope.currentTrades.filter(function(trade) {
          if (type == 'inbox') return trade.other.accepted;
          else return trade.user.accepted;
        }).sort(function(trade) {
          if (['change', 'message'].includes(trade.user.alert)) return -1;
          else return 1
        })
      }

      $scope.setManageView = function(type) {
        $scope.manageView = type;
      };

      $scope.loadMoreUsers = function() {
        $scope.loadingMoreUsers = true;
        searchTradeRange.skip += 12;
        searchTradeRange.limit = 12;
        $http.post('/api/users/bySCURL/', {
            url: $scope.searchURL,
            minFollower: $scope.minSearchTradefollowers,
            maxFollower: $scope.maxSearchTradefollowers,
            recordRange: searchTradeRange
          })
          .then(function(res) {
            $scope.loadingMoreUsers = false;
            $scope.processing = false;
            if (res.data.length > 0) {
              angular.forEach(res.data, function(d) {
                $scope.searchUser.push(d);
              });
            }
          })
          .then(null, function(err) {
            $scope.loadingMoreUsers = false;
            $scope.success = false;
            $scope.processing = false;
            $scope.searchUser = [];
            $.Zebra_Dialog("Please enter Artist url.");
          });
      };

      $scope.$on('loadTrades', function(e) {
        if (window.location.href.includes('reForReLists') && !window.location.href.includes('#organizeschedule') && !window.location.href.includes('#managetrades')) $scope.loadMoreUsers();
      });

      $scope.openTrade = function(user) {
        var found = $scope.currentTrades.find(function(trade) {
          return (trade.other.user._id == user._id);
        });
        if (found) {
          $scope.goToTrade(found);
        } else {
          var trade = {
            messages: [{
              date: new Date(),
              senderId: SessionService.getUser()._id,
              text: SessionService.getUser().soundcloud.username + ' opened a trade.',
              type: 'alert'
            }],
            repeatFor: 0,
            p1: {
              user: SessionService.getUser()._id,
              alert: "none",
              slots: [],
              accepted: true
            },
            p2: {
              user: user._id,
              alert: "change",
              slots: [],
              accepted: false
            }
          }
          $scope.processing = true;
          $http.post('/api/trades/new', trade)
            .then(function(res) {
              $scope.processing = false;
              console.log(res.data);
              $scope.goToTrade(res.data);
            })
            .then(null, function(err) {
              $scope.processing = false;
              $.Zebra_Dialog("Error in creating trade");
            });
        }
      }

      $scope.goToTrade = function(trade) {
        if ($scope.isAdminRoute) {
          window.location.href = '/admin/trade/' + trade.p1.user.soundcloud.pseudoname + '/' + trade.p2.user.soundcloud.pseudoname;
        } else {
          window.location.href = '/artistTools/trade/' + trade.p1.user.soundcloud.pseudoname + '/' + trade.p2.user.soundcloud.pseudoname;
        }
      }

      $scope.manage = function(trade) {
        console.log(trade);
        $scope.goToTrade(trade);
      }

      $scope.remindTrade = function(trade, index) {
        $('#pop').modal('show');
        $scope.theTrade = trade;
        $scope.tradeID = trade._id;
        if (!$scope.$$phase) $scope.$apply()
      }

      if (window.localStorage.getItem("showPopup")) {
        var trade = JSON.parse(window.localStorage.getItem("showPopup"));
        window.localStorage.removeItem("showPopup");
        setTimeout(function() {
          $scope.remindTrade(trade, 0);
        }, 500)
      }

      $scope.sendMail = function(sharelink) {
        $scope.fbMessageLink = sharelink;
        $window.open("mailto:example@demo.com?body=" + sharelink, "_self");
      };

      $scope.deleteTrade = function(tradeID, index) {
        $.Zebra_Dialog('Are you sure you want to delete this trade?', {
          'type': 'confirmation',
          'buttons': [{
            caption: 'No',
            callback: function() {
              console.log('No was clicked');
            }
          }, {
            caption: 'Yes',
            callback: function() {
              $scope.processing = true;
              $http.post('/api/trades/delete', {
                  id: tradeID
                })
                .then(function(res) {
                  $scope.processing = false;
                  $scope.shownTrades.splice(index, 1);
                })
                .then(null, function(err) {
                  $scope.processing = false;
                  $.Zebra_Dialog('Error accepting');
                })
            }
          }]
        });
      }

      $scope.checkNotification = function() {
        $scope.$parent.shownotification = false
        $scope.currentTrades.forEach(function(trade) {
          if (trade.other.accepted) {
            $scope.$parent.shownotification = true;
          }
        });
      }

      $scope.hideNotification = function() {
        $http.put('/api/trades/hideNotification', $scope.shownTrades)
          .then(function(res) {})
          .then(null, function(err) {
            $scope.checkNotification();
          })
      }


      $scope.setCurrentTab = function(currentTab) {
        $scope.currentTab = currentTab;
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

      $scope.getStyle = function() {
        return {
          'border-radius': '4px',
          'border-width': '1px'
        };
      }

      $scope.getEventStyle = function(repostEvent) {
        if (repostEvent.type == 'empty') {
          return {}
        } else if (repostEvent.type == 'traded' && repostEvent.trackInfo.trackID) {
          return {
            'background-color': '#B22222',
            'height': '20px',
            // 'margin': '2px',
            'border-radius': '4px'
          }
        } else if (repostEvent.type == 'traded' && !repostEvent.trackInfo.trackID) {
          return {
            'background-color': '#2b9fda',
            'height': '20px',
            // 'margin': '2px',
            'border-radius': '4px'
          }
        } else if (repostEvent.type == 'multiple') {
          var unfilled = false;
          repostEvent.events.forEach(function(event) {
            if (!event.trackInfo.trackID) unfilled = true;
          })
          if (unfilled) {
            return {
              'background-color': '#7A549B',
              'height': '20px',
              'border-radius': '4px'
            }
          } else {
            return {
              'background-color': '#B22222',
              'height': '20px',
              'border-radius': '4px'
            }
          }
        }
      }

      $scope.getEventText = function(repostEvent) {
        if (repostEvent.type == 'traded') return repostEvent.userInfo.username
        else if (repostEvent.type == 'multiple') return 'Multiple Slots'
      }

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
              ev.type = 'traded';
              eventArray[new Date(ev.trackInfo.day).getHours()] = ev;
            } else if (eventArray[new Date(ev.trackInfo.day).getHours()].type == 'traded') {
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

      $scope.calendar = $scope.fillDateArrays($scope.events);
      $scope.isView = false;
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
          $.Zebra_Dialog('Which slot do you want to edit?', {
            'type': 'question',
            'buttons': buttons
          });
        } else {
          $scope.openPopup(day, hour, data);
        }
      }

      $scope.openPopup = function(day, hour, data) {
        $scope.afcount = 0;
        $scope.deleteEventData = data;
        document.getElementById('scPopupPlayer').style.visibility = "hidden";
        document.getElementById('scPopupPlayer').innerHTML = "";
        $scope.makeEvent = {};
        var makeDay = new Date(day);
        makeDay.setHours(hour);
        $scope.makeEvent = JSON.parse(JSON.stringify(data.trackInfo));
        $scope.makeEvent._id = data.trackInfo._id;
        $scope.makeEvent.day = new Date(data.trackInfo.day);
        $scope.makeEvent.url = data.trackInfo.trackURL;
        $scope.makeEvent.comment = data.trackInfo.comment;
        $scope.makeEvent.timeGap = data.trackInfo.timeGap;
        $scope.makeEvent.artist = data.userInfo;
        var repostDate = new Date(data.trackInfo.day);
        var unrepostDate = new Date(data.trackInfo.unrepostDate);
        var diff = Math.abs(new Date(unrepostDate).getTime() - new Date(repostDate).getTime()) / 3600000;
        $scope.makeEvent.unrepostHours = diff;
        var d = new Date(day).getDay();
        var channels = data.trackInfo.otherChannels;
        $scope.displayChannels = [];
        for (var i = 0; i < $scope.events.length; i++) {
          if (channels.indexOf($scope.events[i].userInfo.id) > -1) {
            $scope.displayChannels.push($scope.events[i].userInfo.username);
          }
        }
        $scope.showOverlay = true;
        var calDay = {};
        var calendarDay = $scope.calendar.find(function(calD) {
          return calD.day.toLocaleDateString() == day.toLocaleDateString();
        });
        if (data.trackInfo.trackURL) {
          $scope.isView = true;
          SC.Widget('scPopupPlayer').load($scope.makeEvent.url, {
            auto_play: false,
            show_artwork: false
          });
          document.getElementById('scPopupPlayer').style.visibility = "visible";
          $scope.showPlayer = true;
        } else {
          $scope.isView = false;
          document.getElementById('scPopupPlayer').style.visibility = "hidden";
          $scope.showPlayer = false;
        }
      }

      $scope.closeModal = function() {
        $scope.showOverlay = false;
      }

      $scope.deleteEvent = function() {
        var eventId = $scope.deleteEventData.trackInfo._id;
        $.Zebra_Dialog('Are you sure you want to delete this trade?', {
          'type': 'question',
          'buttons': [{
            caption: 'Cancel',
            callback: function() {}
          }, {
            caption: 'Yes',
            callback: function() {
              $http.delete('/api/events/repostEvents/' + eventId)
                .then(function(res) {
                  $scope.showOverlay = false;
                  $state.reload();
                  $scope.activeTab = "3";
                })
                .then(null, function(err) {
                  $scope.processing = false;
                  $.Zebra_Dialog("ERROR: Did not delete.")
                });
            }
          }]
        });
      }

      $scope.saveEvent = function() {
        $scope.processing = true;
        var req = $http.put('/api/events/repostEvents', $scope.makeEvent)
          .then(function(res) {
            $scope.makeEventURL = "";
            $scope.makeEvent = null;
            $scope.eventComment = "";
            document.getElementById('scPlayer').style.visibility = "hidden";
            document.getElementById('scPopupPlayer').style.visibility = "hidden";
            $scope.unrepostHours = 1;
            $scope.tabSelected = true;
            $scope.trackType = "";
            $scope.trackArtistID = 0;
            if ($scope.manageView == "newsong") {
              $scope.manageView = "list";
            }
            $http.get("/api/events/getRepostEvents/" + $scope.user._id)
              .then(function(res) {
                $scope.processing = false;
                $scope.calendar = $scope.fillDateArrays(res.data);
                $scope.listevents = res.data;
              }).then(null, function(err) {
                $scope.processing = false;
                $.Zebra_Dialog(err.data);
              });
            $scope.showOverlay = false;
          })
          .then(null, function(err) {
            $scope.processing = false;
            $.Zebra_Dialog(err.data);
          });
      }

      $scope.choseArtist = function(user) {
        $scope.searchURL = user.permalink_url;
        $scope.sendSearch();
      }

      $scope.choseTrack1 = function(track) {
        $scope.showPlayer = true;
        $scope.fillMakeEvent(track);
        var popupPlayerWidget = SC.Widget('scPopupPlayer');
        popupPlayerWidget.load(track.permalink_url, {
          auto_play: false,
          show_artwork: false,
          callback: function() {
            console.log($scope.showPlayer);
            console.log($scope.makeEvent);
            document.getElementById('scPopupPlayer').style.visibility = "visible";
            console.log(document.getElementById('scPopupPlayer'));
            if (!$scope.$$phase) $scope.$apply();
          }
        });
      }

      $scope.fillMakeEvent = function(track) {
        $scope.makeEvent.trackID = track.id;
        $scope.makeEvent.title = track.title;
        $scope.makeEvent.trackURL = track.permalink_url;
        $scope.makeEvent.trackArtUrl = track.artwork_url;
        $scope.makeEvent.trackArtUrl = track.artwork_url;
        $scope.makeEvent.artistName = track.user.username;
      }

      $scope.choseTrack = function(track) {
        $scope.showPlayer = true;
        $scope.fillMakeEvent(track);
        var playerWidget = SC.Widget('scPlayer');
        playerWidget.load(track.permalink_url, {
          auto_play: false,
          show_artwork: true,
          callback: function() {
            document.getElementById('scPlayer').style.visibility = "visible";
            if (!$scope.$$phase) $scope.$apply();
          }
        });
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
      $scope.scheduleRepostEvent = function(data) {
        if (data.trackInfo) {
          $scope.deleteEventData = data;
          $scope.manageView = "newsong";
          document.getElementById('scPlayer').style.visibility = "hidden";
          document.getElementById('scPlayer').innerHTML = "";
          var day = new Date(data.trackInfo.day);
          $scope.makeEvent = {};
          $scope.makeEvent._id = data.trackInfo._id;
          $scope.makeEvent.day = new Date(data.trackInfo.day);
          $scope.makeEvent.url = data.trackInfo.trackURL;
          $scope.makeEvent.comment = data.trackInfo.comment;
          $scope.makeEvent.timeGap = data.trackInfo.timeGap;
          $scope.makeEvent.artist = data.userInfo;
          var repostDate = new Date(data.trackInfo.day);
          var unrepostDate = new Date(data.trackInfo.unrepostDate);
          var diff = Math.abs(new Date(unrepostDate).getTime() - new Date(repostDate).getTime()) / 3600000;
          $scope.makeEvent.unrepostHours = diff;
          $scope.makeEvent.unrepostDate = unrepostDate;
          var d = new Date(day).getDay();
          var channels = data.trackInfo.otherChannels;
          $scope.displayChannels = [];
          for (var i = 0; i < $scope.events.length; i++) {
            if (channels.indexOf($scope.events[i].userInfo.id) > -1) {
              $scope.displayChannels.push($scope.events[i].userInfo.username);
            }
          }
          var calDay = {};
          var calendarDay = $scope.calendar.find(function(calD) {
            return calD.day.toLocaleDateString() == day.toLocaleDateString();
          });
          $scope.showPlayer = false;
        }
      }

      $scope.addNewSongCancel = function() {
        $scope.manageView = "list";
      }

      $scope.allowSave = function() {
        if (!$scope.makeEvent) return false;
        return new Date($scope.makeEvent.day) > new Date();
      }

      $scope.autofillAll = function() {
        $.Zebra_Dialog('Are you sure you want to fill all your slots with your autofill tracks?', {
          'type': 'question',
          'buttons': [{
            caption: 'Cancel',
            callback: function() {}
          }, {
            caption: 'Yes',
            callback: function() {
              $scope.processing = true;
              $http.put("/api/events/repostEvents/autofillAll")
                .then(function(res) {
                  return $http.get('/api/events/getRepostEvents/' + $scope.user._id)
                })
                .then(function(res) {
                  console.log(res.data);
                  $scope.calendar = $scope.fillDateArrays(res.data);
                  $scope.listevents = res.data;
                  $scope.processing = false;
                }).then(null, console.log);
            }
          }]
        });
      }

      $scope.offer = function(trade) {
        if ($scope.itemView == 'sent') {
          return "You are offering " + trade.user.slots.length * (trade.repeatFor > 0 ? trade.repeatFor : 1) + " slots (" + (trade.user.slots.length * trade.user.user.soundcloud.followers * (trade.repeatFor > 0 ? trade.repeatFor : 1)).toLocaleString() + " follower exposure)<br>and asking for " + trade.other.slots.length * (trade.repeatFor > 0 ? trade.repeatFor : 1) + " slots (" + (trade.other.slots.length * trade.other.user.soundcloud.followers * (trade.repeatFor > 0 ? trade.repeatFor : 1)).toLocaleString() + " follower exposure)."
        } else {
          return trade.other.user.soundcloud.username + " is offering " + trade.other.slots.length * (trade.repeatFor > 0 ? trade.repeatFor : 1) + " slots (" + (trade.other.slots.length * trade.other.user.soundcloud.followers * (trade.repeatFor > 0 ? trade.repeatFor : 1)).toLocaleString() + " follower exposure)<br>and asking for " + trade.user.slots.length * (trade.repeatFor > 0 ? trade.repeatFor : 1) + " slots (" + (trade.user.slots.length * trade.user.user.soundcloud.followers * (trade.repeatFor > 0 ? trade.repeatFor : 1)).toLocaleString() + " follower exposure)."
        }
      }

      /*Manage Trades end*/
      $scope.getUserNetwork();
      $scope.verifyBrowser();
      $scope.checkNotification();
      $scope.sortResult($scope.sortby);
      $scope.loadMoreUsers();
      $scope.setView("inbox");

      if ($window.localStorage.getItem('inboxState')) {
        $scope.setView($window.localStorage.getItem('inboxState'));
        $window.localStorage.removeItem('inboxState');
      }
    }
  }
})