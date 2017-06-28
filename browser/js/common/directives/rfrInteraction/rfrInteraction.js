app.directive('rfrinteraction', function($http) {
  return {
    templateUrl: 'js/common/directives/rfrInteraction/rfrInteraction.html',
    restrict: 'E',
    scope: false,
    controller: function rfrInteractionController($rootScope, $state, $scope, $http, AuthService, $window, SessionService, socket, moment) {
      var path = window.location.pathname;
      $window.localStorage.setItem('activetab', '1');
      $scope.isAdminRoute = false;
      if (path.indexOf("admin/") != -1) {
        $scope.isAdminRoute = true;
      }else if(path.indexOf("thirdparty/") != -1){
        $scope.isthirdparty = true;
      }  else {
        $scope.isAdminRoute = false;
      }
      $scope.shownotification = false;
      $scope.chatOpen = false;
      $scope.type = 'remind';
      $scope.change = false;
      $scope.showUndo = false;
      $scope.showEmailModal = false;
      $scope.processing = false;
      socket.connect();
      $scope.makeEventURL = "";
      $scope.showOverlay = false;
      $scope.processong = false;
      $scope.hideall = false;

      $scope.trackArtistID = 0;
      $scope.trackType = "";
      $scope.listDayIncr = 0;
      // $scope.selectTrade = $scope.currentTrades.find(function(el) {
      //   return el._id == $scope.trade._id;
      // });
      var person = $scope.trade.p1.user._id == $scope.user._id ? $scope.trade.p1 : $scope.trade.p2;
      $scope.user.accepted = person.accepted;
      $scope.p1dayIncr = 0;
      $scope.p2dayIncr = 0;
      $scope.repeatOn = ($scope.trade.repeatFor > 0);
      $scope.currentDate = new Date();
      $scope.daysArray = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      $scope.itemview = "calender";

      $scope.setView = function(view) {
        $scope.itemview = view;
        var personNum = $scope.activeUser._id == $scope.trade.p1.user._id ? 'p1' : 'p2';
        $scope.getListEvents(personNum);
      };

      $scope.trackList = [];

      $scope.activeUser = $scope.user;
      $scope.changeActiveUser = function(user) {
        $scope.activeUser = user;
        if (!$scope.$$phase) $scope.$apply();
      }

      $scope.changeRepeatOn = function() {
        $scope.showUndo = true;
        $scope.repeatOn = !$scope.repeatOn;
        if ($scope.reapeatOn) {
          $scope.trade.repeatFor = 4;
        } else {
          $scope.trade.repeatFor = 0;
        }
      }

      $scope.changeRepeatFor = function() {
        $scope.showUndo = true;
        $scope.trade.repeatFor = parseInt($scope.trade.repeatFor);
        if ($scope.trade.repeatFor > 52) {
          $scope.trade.repeatFor = 52;
        } else if ($scope.trade.repeatFor < 0 || $scope.trade.repeatFor == NaN) {
          $scope.trade.repeatFor = 0;
        }
        $scope.repeatOn = $scope.trade.repeatFor > 0;
      }

      $scope.trackListChangeEvent = function(index) {
        $scope.makeEvent.URL = $scope.makeEvent.trackListObj.permalink_url;
        $scope.changeURL();
      };

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

      $scope.getSchedulerID = function(uid) {
        return ((uid == $scope.user._id) ? "scheduler-left" : "scheduler-right");
      }

      $scope.user.accepted = $scope.trade.p1.user._id == $scope.user._id ? $scope.trade.p1.accepted : $scope.trade.p2.accepted;
      // $scope.curTrade = JSON.stringify($.grep($scope.currentTrades, function(e) {
      //   return e._id == $scope.trade._id;
      // }));

      $scope.refreshCalendar = function() {
        $scope.fillCalendar();
        $scope.checkNotification();
      }

      $scope.backToLists = function() {
        console.log('hi')
        $state.go('reForReLists');
      }

      $scope.incrp1 = function(inc) {
        if ($scope.p1dayIncr < 42) $scope.p1dayIncr++;
        console.log($scope.p1dayIncr);
      }
      $scope.decrp1 = function(inc) {
        if ($scope.p1dayIncr > 0) $scope.p1dayIncr--;
      }
      $scope.incrp2 = function(inc) {
        if ($scope.p2dayIncr < 42) $scope.p2dayIncr++;
      }
      $scope.decrp2 = function(inc) {
        if ($scope.p2dayIncr > 0) $scope.p2dayIncr--;
      }

      $scope.changeURL = function() {
        if ($scope.makeEvent.URL != "") {
          $scope.processing = true;
          $http.post('/api/soundcloud/resolve', {
              url: $scope.makeEvent.URL
            })
            .then(function(res) {
              $scope.trackArtistID = res.data.user.id;
              $scope.trackType = res.data.kind;
              if (res.data.kind != "playlist") {
                $scope.makeEvent.trackID = res.data.id;
                $scope.makeEvent.title = res.data.title;
                $scope.makeEvent.trackURL = res.data.trackURL;
                if (res.data.user) $scope.makeEvent.artistName = res.data.user.username;
                SC.oEmbed($scope.makeEvent.URL, {
                  element: document.getElementById('scPlayer'),
                  auto_play: false,
                  maxheight: 150
                })
                document.getElementById('scPlayer').style.visibility = "visible";
                $scope.notFound = false;
                $scope.processing = false;
              } else {
                $scope.notFound = false;
                $scope.processing = false;
                $.Zebra_Dialog("Sorry! We do not currently allow playlist reposting. Please enter a track url instead.");
              }
            }).then(null, function(err) {
              $.Zebra_Dialog("We are not allowed to access this track from Soundcloud. We apologize for the inconvenience, and we are working with Soundcloud to resolve the issue.");
              document.getElementById('scPlayer').style.visibility = "hidden";
              $scope.notFound = true;
              $scope.processing = false;
            });
        }
      }


      $scope.unrepostOverlap = function() {
        if (!$scope.makeEvent.trackID) return false;
        var events = ($scope.makeEvent.person.user._id == $scope.trade.p1.user._id) ? $scope.p1Events : $scope.p2Events;
        var slots = $scope.makeEvent.person.slots;
        var blockEvents = events.filter(function(event) {
          event.day = new Date(event.day);
          event.unrepostDate = new Date(event.unrepostDate);
          if (moment($scope.makeEvent.day).format('LLL') == moment(event.day).format('LLL') && $scope.makeEvent.trackID == event.trackID) return false;
          return ($scope.makeEvent.trackID == event.trackID && event.unrepostDate.getTime() > $scope.makeEvent.day.getTime() - 24 * 3600000 && event.day.getTime() < $scope.makeEvent.unrepostDate.getTime() + 24 * 3600000);
        })
        var blockEvents2 = slots.filter(function(slot) {
          slot.day = new Date(slot.day);
          slot.unrepostDate = new Date(slot.unrepostDate);
          if (moment($scope.makeEvent.day).format('LLL') == moment(slot.day).format('LLL') && $scope.makeEvent.trackID == slot.trackID) return false;
          return ($scope.makeEvent.trackID == slot.trackID && slot.unrepostDate.getTime() > $scope.makeEvent.day.getTime() - 24 * 3600000 && slot.day.getTime() < $scope.makeEvent.unrepostDate.getTime() + 24 * 3600000);
        })
        return blockEvents.length > 0 || blockEvents2.length > 0;
      }

      $scope.changeTrade = function(trade) {
        $state.go('reForReInteraction', {
          tradeID: trade._id
        })
      }

      $scope.backEvent = function() {
        $scope.makeEvent = undefined;
        $scope.trackType = "";
        $scope.trackArtistID = 0;
        $scope.showOverlay = false;
      }

      $scope.deleteEvent = function(calEvent, person) {
        person.slots = person.slots.filter(function(slot, index) {
          return !(moment(slot.day).format('LLL') == moment(calEvent.day).format('LLL'));
        });
        $scope.showUndo = true;
        $scope.fillCalendar();
      }

      $scope.checkNotification = function() {
        var user = SessionService.getUser();
        if (user) {
          return $http.get('/api/trades/withUser/' + user._id)
            .then(function(res) {
              var trades = res.data;
              var trade = trades.find(function(t) {
                return t._id.toString() == $scope.trade._id.toString();
              });
              console.log('trade', trade);
              if (trade) {
                if (trade.p1.user._id == user._id) {
                  if (trade.p1.alert == "change" && $scope.chatOpen == false) {
                    $scope.shownotification = true;
                  }
                }
                if (trade.p2.user._id == user._id) {
                  if (trade.p2.alert == "change" && $scope.chatOpen == false) {
                    $scope.shownotification = true;
                  }
                }
              }
            });
        } else {
          return 'ok';
        }
      }
      $scope.saveTrade = function() {
        if ($scope.trade.p1.user._id == $scope.user._id) {
          $scope.trade.p1.accepted = true;
          $scope.trade.p2.accepted = false;
        } else {
          $scope.trade.p2.accepted = true;
          $scope.trade.p1.accepted = false;
        }
        if ($scope.trade.p1.slots.length == 0 || $scope.trade.p2.slots.length == 0) {
          $.Zebra_Dialog("Issue! At least one slot on each account must be selected.");
        } else {
          $.Zebra_Dialog("Request trade? Giving " + $scope.stringSlots($scope.trade.user) + " (" + $scope.stringReach($scope.trade.user) + ") for " + $scope.stringSlots($scope.trade.other) + " (" + $scope.stringReach($scope.trade.other) + ").", {
            'type': 'confirmation',
            'buttons': [{
              caption: 'Cancel',
              callback: function() {
                console.log('No was clicked');
              }
            }, {
              caption: 'Request',
              callback: function() {
                $scope.processing = true;
                $scope.trade.changed = true;
                $http.put('/api/trades', $scope.trade)
                  .then(function(res) {
                    res.data.other = ($scope.trade.p1.user._id == $scope.user._id) ? $scope.trade.p2 : $scope.trade.p1;
                    res.data.user = ($scope.trade.p1.user._id == $scope.user._id) ? $scope.trade.p1 : $scope.trade.p2;
                    $scope.trade = res.data;
                    $scope.emitMessage($scope.user.soundcloud.username + " requested/updated this trade.", 'alert');
                    $scope.processing = false;
                    $scope.showUndo = false;
                    $window.localStorage.setItem('activetab', '2');
                    $window.localStorage.setItem('inboxState', 'sent');
                    window.localStorage.setItem("showPopup", JSON.stringify($scope.trade));
                    if ($scope.isthirdparty) {
                      $state.go('thirdpartyRepostTraders');
                    }else if ($scope.isAdminRoute) {
                      $state.go('adminRepostTraders');
                    } else {
                      $state.go('reForReLists');
                    }
                  })
                  .then(null, function(err) {
                    $scope.showOverlay = false;
                    $scope.processing = false;
                    $.Zebra_Dialog('Error requesting');
                  })
              }
            }]
          });
        }
      }

      $scope.openChat = function() {
        $scope.chatOpen = true;
        $scope.msgCount = 0;
        $scope.shownotification = false;
      }

      $scope.undo = function() {
        $scope.processing = true;
        $http.get('/api/trades/byID/' + $scope.trade._id)
          .then(function(res) {
            $scope.processing = false;
            $scope.trade = res.data;
            $scope.trade.other = ($scope.trade.p1.user._id == $scope.user._id) ? $scope.trade.p2 : $scope.trade.p1;
            $scope.trade.user = ($scope.trade.p1.user._id == $scope.user._id) ? $scope.trade.p1 : $scope.trade.p2;
            $scope.trade.user.user.pseudoAvailableSlots = createPseudoAvailableSlots($scope.trade.user.user);
            $scope.trade.other.user.pseudoAvailableSlots = createPseudoAvailableSlots($scope.trade.other.user);
            $scope.fillCalendar();
            var personNum = $scope.activeUser._id == $scope.trade.p1.user._id ? 'p1' : 'p2';
            $scope.getListEvents(personNum);
            $scope.showUndo = false;
          }).then(null, console.log)
      };

      $scope.saveEvent = function(event, person) {
        person.slots = person.slots.filter(function(slot, index) {
          return !(moment(slot.day).format('LLL') === moment(event.day).format('LLL'));
        });
        person.slots.push(event);
        $scope.showUndo = true;
        $scope.fillCalendar();
      }

      $scope.totalReach = function(person) {
        return "Total Reach: " + (person.slots.length * person.user.soundcloud.followers * ($scope.trade.repeatFor > 0 ? $scope.trade.repeatFor : 1)).toLocaleString();
      }

      $scope.stringReach = function(person) {
        return (person.slots.length * person.user.soundcloud.followers * ($scope.trade.repeatFor > 0 ? $scope.trade.repeatFor : 1)).toLocaleString() + " follower exposure";
      }

      $scope.totalSlots = function(person) {
        return person.slots.length * ($scope.trade.repeatFor > 0 ? $scope.trade.repeatFor : 1) + " Slots";
      }

      $scope.stringSlots = function(person) {
        return person.slots.length * ($scope.trade.repeatFor > 0 ? $scope.trade.repeatFor : 1) + " slots";
      }

      $scope.emailSlot = function() {
        var mailto_link = "mailto:?subject=Repost of " + $scope.makeEvent.title + '&body=Hey,\n\n I am reposting your song ' + $scope.makeEvent.title + ' on ' + $scope.makeEventAccount.username + ' on ' + $scope.makeEvent.day.toLocaleDateString() + '.\n\n Best, \n' + $scope.user.soundcloud.username;
        location.href = encodeURI(mailto_link);
      }

      $scope.changeUnrepost = function() {
        if ($scope.makeEvent.unrepost) {
          $scope.makeEvent.day = new Date($scope.makeEvent.day);
          $scope.makeEvent.unrepostDate = new Date($scope.makeEvent.day.getTime() + 48 * 60 * 60 * 1000);
        } else {
          $scope.makeEvent.unrepostDate = new Date(0);
        }
      }

      $scope.clickedSlot = function(day, dayOffset, hour, calendar, person, event) {
        var style = {};
        var currentDay = new Date(day).getDay();

        var date = (new Date(day)).setHours(hour);
        if (!($scope.activeUser.pseudoAvailableSlots[$scope.daysArray[currentDay]] && $scope.activeUser.pseudoAvailableSlots[$scope.daysArray[currentDay]].indexOf(hour) > -1 && date > (new Date().getTime() + 24 * 3600000)) || ($scope.activeUser.blockRelease && new Date($scope.activeUser.blockRelease) > date)) {
          if (event.type != 'trade') return false;
        }

        var makeDay = new Date(day);
        makeDay.setHours(hour, 30, 0, 0);
        switch (event.type) {
          case 'queue':
          case 'track':
          case 'paid':
          case 'traded':
            return false;
            break;
          case 'empty':
            var calEvent = {
              type: "trade",
              day: makeDay,
              userID: person.user.soundcloud.id,
              unrepostDate: new Date(makeDay.getTime() + 48 * 60 * 60 * 1000)
            };
            $scope.saveEvent(calEvent, person);
            break;
          case 'trade':
            $scope.deleteEvent(event, person);
            break;
        }
      }

      $scope.email = function() {
        var otherUser = $scope.trade.p1.user._id == $scope.user._id ? $scope.trade.p2.user : $scope.trade.p1.user;
        var mailto_link = "mailto:" + otherUser.email + "?subject=Repost for repost with " + $scope.user.soundcloud.username + '&body=Hey ' + otherUser.soundcloud.username + ',\n\n Repost for repost? I scheduled a trade here! -> ArtistsUnlimited.co/login\n\nBest,\n' + $scope.user.soundcloud.username;
        location.href = encodeURI(mailto_link);
      }

      $scope.acceptTrade = function() {
        $.Zebra_Dialog("Accept trade? Giving " + $scope.stringSlots($scope.trade.user) + " (" + $scope.stringReach($scope.trade.user) + ") for " + $scope.stringSlots($scope.trade.other) + " (" + $scope.stringReach($scope.trade.other) + ").", {
          'type': 'confirmation',
          'buttons': [{
            caption: 'Cancel',
            callback: function() {
              console.log('No was clicked');
            }
          }, {
            caption: 'Accept',
            callback: function() {
              $scope.completeTrade();
            }
          }]
        });
      }

      $scope.autoFillTracks = [];
      $scope.trackListObj = null;
      $scope.trackListSlotObj = null;
      $scope.newQueueSong = "";

      $scope.trackChange = function(index) {
        $scope.makeEventURL = $scope.trackListSlotObj.permalink_url;
        $scope.changeURL();
      };

      $scope.trackListChange = function(index) {
        $scope.newQueueSong = $scope.trackListObj.permalink_url;
        $scope.processing = true;
        $scope.changeQueueSong();
      };

      $scope.addSong = function() {

        if ($scope.user.queue.indexOf($scope.newQueueID) != -1) return;
        $scope.user.queue.push($scope.newQueueID);
        $scope.saveUser();
        $scope.newQueueSong = undefined;
        $scope.trackListObj = "";
        $scope.newQueue = undefined;
        $scope.accept();
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
              $scope.newQueue = track;
              $scope.newQueueID = track.id;
            })
            .then(null, function(err) {
              $scope.newQueueSong = "";
              $('#autoFillTrack').modal('hide');
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
            })
            .then(null, function(err) {
              $.Zebra_Dialog("Error: did not save");
              $scope.processing = false;
            });
          $('#autoFillTrack').modal('hide');
        }
        //overlay autofill track end//

      socket.on('init', function(data) {
        $scope.name = data.name;
        $scope.users = data.users;
      });

      socket.on('send:message', function(message) {
        console.log('send');
        console.log(message);
        if (message.tradeID == $scope.trade._id) {
          $scope.msgHistory.push(message);
          $scope.message = message.message;
          $scope.checkNotification();
          $scope.trade.messages.push(message);
          if (message.type == "alert") {
            $scope.refreshCalendar();
          }
        }
      });

      socket.on('get:message', function(data) {
        console.log('get')
        console.log(data);
        $scope.msgCount = 0;
        if (data != '' && data._id == $scope.trade._id) {
          $scope.msgHistory = data ? data.messages : [];
          $scope.msgCount++;
          $scope.checkNotification();
          if ($scope.msgHistory[$scope.msgHistory.length - 1].type == "alert") {
            $scope.undo();
          }
        }
      });

      $scope.msgCount = 0;
      $scope.emitMessage = function(message, type) {
        socket.emit('send:message', {
          message: message,
          type: type,
          id: $scope.user._id,
          tradeID: $scope.trade._id
        });
        $scope.message = '';
      }

      $scope.getMessage = function() {
        socket.emit('get:message', $scope.trade._id);
      }

      $scope.fillDateArrays = function(events, slots) {
        var calendar = [];
        var today = new Date();
        for (var i = 0; i < 50; i++) {
          var calDay = {};
          calDay.day = new Date(today);
          calDay.day.setDate(today.getDate() + i);
          var dayEvents = events.filter(function(ev) {
            return (ev.day.toLocaleDateString() == calDay.day.toLocaleDateString());
          });
          slots.forEach(function(slot) {
            if (slot.day.toLocaleDateString() == calDay.day.toLocaleDateString()) dayEvents.push(slot);
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
      }

      $scope.fillCalendar = function() {
        $scope.repeatOn = $scope.trade.repeatFor > 0;

        function setEventDays(arr) {
          arr.forEach(function(ev) {
            ev.day = new Date(ev.day);
          })
        }
        setEventDays($scope.p1Events);
        setEventDays($scope.p2Events);
        setEventDays($scope.trade.p1.slots);
        setEventDays($scope.trade.p2.slots);

        var now = new Date()
        now.setHours(now.getHours(), 30, 0, 0);

        var change = false;
        $scope.trade.p1.slots = $scope.trade.p1.slots.filter(function(slot) {
          if (slot.day < now) {
            change = true;
            return false;
          } else return true
        });
        $scope.p1Events.forEach(function(event) {
          $scope.trade.p1.slots = $scope.trade.p1.slots.filter(function(slot) {
            if (slot.day.toLocaleDateString() == event.day.toLocaleDateString() && slot.day.getHours() == event.day.getHours()) {
              change = true;
              return false;
            } else return true;
          })
        })

        $scope.trade.p2.slots = $scope.trade.p2.slots.filter(function(slot) {
          if (slot.day < now) {
            change = true;
            return false;
          } else return true
        });
        $scope.p2Events.forEach(function(event) {
          $scope.trade.p2.slots = $scope.trade.p2.slots.filter(function(slot) {
            if (slot.day.toLocaleDateString() == event.day.toLocaleDateString() && slot.day.getHours() == event.day.getHours()) {
              change = true;
              return false;
            } else return true;
          })
        })
        $scope.calendarp1 = $scope.fillDateArrays($scope.p1Events, $scope.trade.p1.slots);
        $scope.calendarp2 = $scope.fillDateArrays($scope.p2Events, $scope.trade.p2.slots);
      }
      $scope.fillCalendar();

      // $scope.updateAlerts = function() {
      //   if ($scope.trade.p1.user._id == $scope.user._id) {
      //     $scope.trade.p1.alert = "none";
      //   }

      //   if ($scope.trade.p2.user._id == $scope.user._id) {
      //     $scope.trade.p2.alert = "none";
      //   }
      //   $http.put('/api/trades', $scope.trade);
      //   $scope.shownotification = false;
      // }

      $scope.completeTrade = function() {
        $scope.processing = true;
        if ($scope.trade.repeatFor > 0) {
          var now = new Date();
          now.setHours(0);
          now.setMinutes(0);
          var endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          var p1WeekSlots = $scope.trade.p1.slots.filter(function(slot) {
            return slot.day < endDate;
          })
          var p2WeekSlots = $scope.trade.p2.slots.filter(function(slot) {
            return slot.day < endDate;
          })
          for (var i = 0; i < $scope.trade.repeatFor; i++) {

            p1WeekSlots.forEach(function(slot) {
              var event = JSON.parse(JSON.stringify(slot));
              event.type = 'traded';
              event.owner = $scope.trade.p2.user._id;
              event.day = new Date((new Date(slot.day)).getTime() + i * 7 * 24 * 60 * 60 * 1000);
              event.unrepostDate = new Date(event.day.getTime() + 48 * 60 * 60 * 1000);
              $scope.createEventWithUserTradeSettings(event, $scope.trade.p1.user);
            })

            p2WeekSlots.forEach(function(slot) {
              var event = JSON.parse(JSON.stringify(slot));
              event.type = 'traded';
              event.owner = $scope.trade.p1.user._id
              event.day = new Date((new Date(slot.day)).getTime() + i * 7 * 24 * 60 * 60 * 1000);
              event.unrepostDate = new Date(event.day.getTime() + 48 * 60 * 60 * 1000);
              $scope.createEventWithUserTradeSettings(event, $scope.trade.p2.user);
            })
          }
        } else {
          $scope.trade.p1.slots.forEach(function(slot) {
            var event = slot;
            event.type = 'traded';
            event.owner = $scope.trade.p2.user._id;
            $scope.createEventWithUserTradeSettings(event, $scope.trade.p1.user);
          })
          $scope.trade.p2.slots.forEach(function(slot) {
            var event = slot;
            event.type = 'traded';
            event.owner = $scope.trade.p1.user._id;
            $scope.createEventWithUserTradeSettings(event, $scope.trade.p2.user);
          })
        }
        $scope.trade.p1.accepted = $scope.trade.p2.accepted = true;
        $scope.trade.p1.slots = $scope.trade.p2.slots = [];
        $scope.trade.changed = true;
        $http.put('/api/trades', $scope.trade)
          .then(function(res) {
            $window.localStorage.setItem('activetab', '3');
            if ($scope.isAdminRoute) {
              $state.go('adminRepostTraders');
            } else {
              $rootScope.newManageSlots = true;
              $state.go('reForReLists');
            }
          })
          .then(null, console.log);
      }

      $scope.createEventWithUserTradeSettings = function(event, user) {
        if (user && user.repostSettings) {
          event.like = ((user.repostSettings.trade && user.repostSettings.trade.like) ? user.repostSettings.trade.like : false);
          var userTradeComments = ((user.repostSettings.trade && user.repostSettings.trade.comments) ? user.repostSettings.trade.comments : []);
          if (userTradeComments.length > 0) {
            event.comment = userTradeComments[Math.floor(Math.random() * userTradeComments.length)];
          }
          $http.post('/api/events/repostEvents', event);
        } else {
          $http.post('/api/events/repostEvents', event);
        }
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
        var personNum = $scope.activeUser._id == $scope.trade.p1.user._id ? 'p1' : 'p2';
        $scope.getListEvents(personNum);
      }

      $scope.getNextEvents = function() {
        $scope.listDayIncr++;
        var personNum = $scope.activeUser._id == $scope.trade.p1.user._id ? 'p1' : 'p2';
        $scope.getListEvents(personNum);
      }

      $scope.toggleSlot = function(item) {
        var personNum = $scope.activeUser._id == $scope.trade.p1.user._id ? 'p1' : 'p2';
        $scope.clickedSlot(item.date, {}, item.date.getHours(), {}, $scope.trade[personNum], item.event);
        $scope.getListEvents(personNum);
      }

      $scope.getListEvents = function(userNum) {
        $scope.listEvents = [];
        var currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + $scope.listDayIncr);
        for (var i = 0; i < 7; i++) {
          var d = new Date(currentDate);
          d.setDate(d.getDate() + i);
          var currentDay = d.getDay();
          var strDdate = getshortdate(d);
          var slots = $scope.trade[userNum].user.pseudoAvailableSlots[$scope.daysArray[currentDay]];
          slots = slots.sort(function(a, b) {
            return a - b
          });
          angular.forEach(slots, function(hour) {
            var item = new Object();
            var calendarDay = $scope['calendar' + userNum].find(function(calD) {
              return calD.day.toLocaleDateString() == d.toLocaleDateString();
            });
            var event = calendarDay.events.find(function(ev) {
              return new Date(ev.day).getHours() == hour;
            });

            item.event = (event ? event : {
              type: 'empty'
            })
            var dt = new Date(d);
            dt.setHours(hour);
            item.date = new Date(dt);
            if (item.date > (new Date().getTime() + 24 * 3600000))
              $scope.listEvents.push(item);
          });
        }
        if (!$scope.$$phase) $scope.$apply();
      }

      $scope.getUnrepostDate = function(item) {
        return new Date(item.date.getTime() + 48 * 60 * 60 * 1000)
      }

      $scope.getStyle = function(event, date, day, hour) {
        var style = {
          'border-radius': '4px',
          'border-width': '1px'
        };
        var currentDay = new Date(date).getDay();
        var date = (new Date(date)).setHours(hour)
        if ($scope.activeUser.pseudoAvailableSlots[$scope.daysArray[currentDay]] && $scope.activeUser.pseudoAvailableSlots[$scope.daysArray[currentDay]].indexOf(hour) > -1 && date > (new Date().getTime() + 24 * 3600000) && (event.type == 'empty' || event.type == 'trade') && !($scope.activeUser.blockRelease && new Date($scope.activeUser.blockRelease).getTime() > date)) {
          style = {
            'background-color': '#fff',
            'border-color': "#999",
            'border-width': '1px',
            'border-radius': '4px'
          }
        }
        return style;
      }

      $scope.getEventStyle = function(event) {
        if (event && event.type == 'trade') {
          return {
            'background-color': '#FFD450',
            'height': '18px',
            'margin': '2px',
            'border-radius': '4px'
          }
        } else {
          return {}
        }
      }

      $scope.dayOfWeekAsString = function(date) {
        var dayIndex = date.getDay();
        return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex];

      }


      $scope.unrepostSymbol = function(event) {
        if (!event.unrepostDate) return;
        event.unrepostDate = new Date(event.unrepostDate);
        return event.unrepostDate > new Date();
      }

      $scope.showBoxInfo = function(event) {
        return (event.type == 'trade' || event.type == 'traded')
      }

      $scope.followerShow = function() {
        return (screen.width > '436');
      }

      $scope.updateEmail = function(email) {
        var answer = email;
        var myArray = answer.match(/[a-z\._\-!#$%&'+/=?^_`{}|~]+@[a-z0-9\-]+\.\S{2,3}/igm);
        if (myArray) {
          $scope.user.email = answer;
          return $http.put('/api/database/profile', $scope.user)
            .then(function(res) {
              SessionService.create(res.data);
              $scope.user = SessionService.getUser();
              $scope.hideall = false;
              $('#emailModal').modal('hide');
              $scope.showEmailModal = false;
            })
            .then(null, function(err) {
              setTimeout(function() {
                $scope.showEmailModal = false;
                $scope.promptForEmail();
              }, 600);
            })
        } else {
          setTimeout(function() {
            $scope.showEmailModal = false;
            $scope.promptForEmail();
          }, 600);
        }
      }

      $scope.promptForEmail = function() {
        if (!$scope.user.email) {
          $scope.showEmailModal = true;
          $('#emailModal').modal('show');
        }
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
          } else {
            $scope.promptForEmail();
          }
        } else {
          $scope.promptForEmail();
        }
      }

      $scope.remindTrade = function() {
        $('#pop').modal('show');
      }
      $scope.verifyBrowser();
      $scope.checkNotification();
    }
  }
});
