app.config(function($stateProvider) {
  $stateProvider.state('submissions', {
    url: '/admin/submissions',
    templateUrl: 'js/submissions/views/submissions.html',
    controller: 'SubmissionController'
  });
});

app.controller('SubmissionController', function($rootScope, $state, $scope, $http, $window, AuthService, SessionService, AccountSettingServices, $sce) {
  $scope.counter = 0;
  $scope.channelSelect = "all";
  $scope.showingElements = [];
  $scope.marketSubmissions = [];
  $scope.selectedGroups = [];
  $scope.selectedChannelIDS = [];
  $scope.selectedGroupChannelIDS = [];
  $scope.selectedChannelName = [];
  $scope.adminStats = {
    mpEarnings: 0,
    subEarnings: 0,
    earnings: 0,
    ffEarnings: 0,
    refunds: 0,
    refundAmount: 0,
    future: 0
  };

  $scope.genres = [
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

  $scope.allowance = 0;
  $scope.genre = "all";
  $scope.displayType = 'channel';
  $scope.limit = 10;
  $scope.marketLimit = 10;
  $scope.isLoggedIn = SessionService.getUser() ? true : false;
  if (!SessionService.getUser()) {
    $state.go('admin');
  }
  $scope.user = SessionService.getUser();
  $scope.user.isAdmin = $scope.user.role == 'admin' ? true : false;
  $scope.uniqueGroup = [];
  $scope.paidRepostAccounts = [];
  $scope.dynamicButton = [{
    "name": "SUBMITTER'S NAME",
    "appendText": " {SUBMITTERS_NAME} "
  }, {
    "name": "SUBMITTER'S EMAIL",
    "appendText": " {SUBMITTERS_EMAIL} "
  }, {
    "name": "TRACK TITLE",
    "appendText": " {TRACK_TITLE} "
  }, {
    "name": "TRACK TITLE W/ LINK",
    "appendText": " {TRACK_TITLE_WITH_LINK} "
  }, {
    "name": "TRACK ARTIST",
    "appendText": " {TRACK_ARTIST} "
  }, {
    "name": "TRACK ARTIST W/ LINK",
    "appendText": " {TRACK_ARTIST_WITH_LINK} "
  }, {
    "name": "TODAYS DATE",
    "appendText": " {TODAYSDATE} "
  }, {
    "name": "SUBMITTED TO ACCOUNT NAME",
    "appendText": " {SUBMITTED_TO_ACCOUNT_NAME} "
  }, {
    "name": "SUBMITTED ACCOUNT NAME W/ LINK",
    "appendText": " {SUBMITTED_ACCOUNT_NAME_WITH_LINK} "
  }];
  if (window.location.href.indexOf('admin/submissions#mysubmissions') != -1) {
    $('.nav-tabs a[href="#mysubmissions"]').tab('show');
  } else if (window.location.href.indexOf('admin/submissions#marketplace') != -1) {
    $('.nav-tabs a[href="#marketplace"]').tab('show');
  } else if (window.location.href.indexOf('admin/submissions#managesubmissions') != -1) {
    $('.nav-tabs a[href="#managesubmissions"]').tab('show');
  }

  $scope.sendTestMail = function(index) {
    $scope.emailIndex = index;
    $scope.testEmail("testemail@artistsunlimited.com");
    // $scope.showTestEmailModal = true;
    // $('#emailModal').modal('show');
  }

  $scope.testEmail = function(email) {
    $scope.showTestEmailModal = false;
    $('#emailModal').modal('hide');
    var subject = $scope.customEmailButtons[$scope.emailIndex].subject;
    var body = $scope.customEmailButtons[$scope.emailIndex].emailBody;
    body = formatForTestEmail(body, email);
    subject = formatForTestEmail(subject, email);
    $window.open("mailto:" + email + "?body=" + body + "&subject=" + subject, "_self");
  }

  function formatForTestEmail(item, email) {
    return encodeURIComponent(item.replace(/{SUBMITTERS_EMAIL}/g, email).replace(/{SUBMITTERS_NAME}/g, "Johnny Submitter").replace(/{TRACK_TITLE_WITH_LINK}/g, "Oliver Nelson ft. Kaleem Taylor - Ain't A Thing" + ' (https://soundcloud.com/olivernelson/oliver-nelson-ft-kaleem-taylor-aint-a-thing-3)').replace(/{TRACK_TITLE}/g, "Oliver Nelson ft. Kaleem Taylor - Ain't A Thing").replace(/{TRACK_ARTIST_WITH_LINK}/g, "Oliver Nelson" + ' (https://soundcloud.com/olivernelson)').replace(/{TRACK_ARTIST}/g, "Oliver Nelson").replace(/{SUBMITTED_TO_ACCOUNT_NAME}/g, "La Tropical").replace(/{SUBMITTED_ACCOUNT_NAME_WITH_LINK}/g, 'La Tropical (https://soundcloud.com/latropical)').replace('{TODAYSDATE}', new Date().toLocaleDateString()));
  }

  $scope.togglePoolOn = function() {
    // $scope.user.repostSettings.poolOn = !$scope.user.repostSettings.poolOn;
    SessionService.create($scope.user);
    AccountSettingServices.updateAdminProfile({
      'repostSettings.poolOn': $scope.user.repostSettings.poolOn
    });
  }

  $scope.whatIsPool = function() {
    $.Zebra_Dialog("By enabling the AU Marketplace you agree that every submission that you accept will also be shared to all other AU Admins in the AU Marketplace. By doing so, you will gain access to all submissions from other admins that have enabled the AU MarketPlace. As well, you will make 10% of every sale that is made from a submission that originated to one of your network accounts.");
  }

  $scope.changeChannelSelect = function() {
    $scope.showingElements = [];
    $scope.loadSubmissions();
  }
  //rascal add 3-30
  $scope.changeChannelSelect_repost = function() {
    $scope.showingElements = [];
    $scope.loadMarketSubmissions();
  }
  $scope.loadSubmissions = function() {
    var genre = $scope.genre.replace(/[0-9]/g, '');
    var selectedGenre = genre.replace('(', '').replace(')', '').trim();
    $scope.processing = true;
    $http.get('/api/submissions/unaccepted?genre=' + encodeURIComponent(selectedGenre) + "&skip=" + $scope.showingElements.length + "&limit=" + $scope.limit + "&userID=" + $scope.channelSelect)
      .then(function(res) {
        $scope.processing = false;
        if (res.data.length > 0) {
          angular.forEach(res.data, function(d) {
            d.selectedChannelName = [];
            d.selectedChannelIDS = [];
            d.selectedGroups = [];
            d.playerURL = $sce.trustAsResourceUrl("https://w.soundcloud.com/player/?url=http://api.soundcloud.com/tracks/" + d.trackID + "&auto_play=false&show_artwork=true")
            $scope.showingElements.push(d)
          });
        }
        if (!$scope.$$phase) $scope.$apply();
      })
      .then(null, function(err) {
        $scope.processing = false;
        $.Zebra_Dialog('Error: Could not get channels.')
        console.log(err);
      });
  }

  $scope.loadMore = function() {
    $scope.loadSubmissions();
  }

  $scope.loadMoreMarket = function() {
    $scope.loadMarketSubmissions();
  }

  $scope.loadMarketSubmissions = function() {
    var genre = $scope.genre.replace(/[0-9]/g, '');
    var selectedGenre = genre.replace('(', '').replace(')', '').trim();
    $scope.processing = true;
    $http.get('/api/submissions/getMarketPlaceSubmission?genre=' + encodeURIComponent(selectedGenre) + "&skip=" + $scope.marketSubmissions.length + "&limit=" + $scope.marketLimit)
      .then(function(res) {
        $scope.processing = false;
        if (res.data.length > 0) {
          angular.forEach(res.data, function(d) {
            d.selectedChannelName = [];
            d.selectedChannelIDS = [];
            d.selectedGroups = [];
            d.pooledSendDate = new Date(d.pooledSendDate);
            d.playerURL = $sce.trustAsResourceUrl("https://w.soundcloud.com/player/?url=http://api.soundcloud.com/tracks/" + d.trackID + "&auto_play=false&show_artwork=true")
            $scope.marketSubmissions.push(d)
          });
        }
      })
      .then(null, function(err) {
        $scope.processing = false;
        $.Zebra_Dialog('Error: Could not get channels.')
        console.log(err);
      });
  }

  $scope.checkboxStyle = function(sub, chan) {
    if (sub.approvedChannels.includes(chan.user.id)) return {
      'background-color': '#E5FEE5',
      'border-radius': '5px',
      'padding': '5px 5px'
    }
    else return {}
  }

  $scope.changeBox = function(sub, chan) {
    if (!chan.linkInBio) {
      sub[chan.user.username] = false;
      $.Zebra_Dialog("You need to <span style='font-weight:bold'>put this link in your Soundcloud bio</span> to be able to sell reposts with this account:<br><br><a href='" + chan.submissionUrl + "' target='_blank'>" + chan.submissionUrl + '</a>');
    } else {
      var index = sub.selectedChannelIDS.indexOf(chan.user.id);
      if (index == -1) {
        sub.selectedChannelIDS.push(chan.user.id);
        sub.selectedChannelName.push(chan.user.username);
      } else {
        sub.selectedChannelIDS.splice(index, 1);
        sub.selectedChannelName.splice(index, 1);
      }
    }
  }

  $scope.changeBoxGroup = function(sub, group) {
    var ind = sub.selectedGroups.indexOf(group);
    if (sub[group]) {
      if (ind == -1) {
        sub.selectedGroups.push(group);
      }
    } else {
      sub.selectedGroups.splice(ind, 1);
    }
    $scope.selectedGroupChannelIDS = [];
    sub.selectedGroups.forEach(function(g) {
      $scope.paidRepostAccounts.forEach(function(acc) {
        if (acc.groups.indexOf(g) != -1) {
          if ($scope.selectedGroupChannelIDS.indexOf(acc.user.id) == -1) {
            $scope.selectedGroupChannelIDS.push(acc.user.id);
          }
        }
      });
    });
  }

  $scope.save = function(submi) {
    submi.selectedChannelIDS.forEach(function(cid) {
      if ($scope.selectedGroupChannelIDS.indexOf(cid) == -1) {
        $scope.selectedGroupChannelIDS.push(cid);
      }
    });
    submi.channelIDS = $scope.selectedGroupChannelIDS;
    if (submi.channelIDS.length == 0) {
      $.Zebra_Dialog("You have not selected any channels to accept repost.");
    } else {
      delete submi.selectedGroups;
      delete submi.selectedChannelIDS;
      delete submi.selectedChannelName;
      submi.password = $rootScope.password;
      $scope.processing = true;
      $http.put("/api/submissions/save", submi)
        .then(function(sub) {
          $scope.showingElements.splice($scope.showingElements.indexOf(submi), 1);
          $scope.processing = false;
        })
        .then(null, function(err) {
          $scope.processing = false;
          $.Zebra_Dialog("ERROR: did not Save")
        })
    }
  }

  $scope.ignore = function(submission) {
    $scope.processing = true;
    $http.delete('/api/submissions/ignore/' + submission._id + '/' + $rootScope.password)
      .then(function(res) {
        var index = $scope.showingElements.indexOf(submission);
        $scope.showingElements.splice(index, 1);
        $scope.processing = false;
      })
      .then(null, function(err) {
        $scope.processing = false;
        $.Zebra_Dialog("ERROR: did not Ignore");
      });
  }

  $scope.decline = function(submission) {
    $scope.processing = true;
    $http.delete('/api/submissions/decline/' + submission._id + '/' + $rootScope.password)
      .then(function(res) {
        var index = $scope.showingElements.indexOf(submission);
        $scope.showingElements.splice(index, 1);
        $scope.processing = false;
      })
      .then(null, function(err) {
        $scope.processing = false;
        $.Zebra_Dialog("ERROR: did not Decline");
      });
  }

  $scope.marketSave = function(submi) {
    // if ($scope.allowance <= 0) $.Zebra_Dialog('You are out of Marketplace Credits. For every direct submission you make a sale on, you will be given 10 more Marketplace Credits.')
    // else if ($scope.marketSubmissions.indexOf(submi) != 0) $.Zebra_Dialog('Please respond to the first submission first.');
    // else {
    submi.selectedChannelIDS.forEach(function(cid) {
      if ($scope.selectedGroupChannelIDS.indexOf(cid) == -1) {
        $scope.selectedGroupChannelIDS.push(cid);
      }
    });
    submi.pooledChannelIDS = submi.pooledChannelIDS.concat($scope.selectedGroupChannelIDS);
    delete submi.selectedGroups;
    delete submi.selectedChannelIDS;
    delete submi.selectedChannelName;
    submi.password = $rootScope.password;
    $scope.processing = true;
    $http.put("/api/submissions/save", submi)
      .then(function(sub) {
        $scope.marketSubmissions.splice($scope.marketSubmissions.indexOf(submi), 1);
        $scope.processing = false;
        // $scope.allowance--;
      })
      .then(null, function(err) {
        $scope.processing = false;
        $.Zebra_Dialog("ERROR: did not Save")
      })
      // }
  }

  $scope.marketIgnore = function(submission) {
      // if ($scope.allowance <= 0) $.Zebra_Dialog('You are out of Marketplace Credits. For every direct submission you make a sale on, you will be given 10 more Marketplace Credits.')
      // else if ($scope.marketSubmissions.indexOf(submission) != 0) $.Zebra_Dialog('Please respond to the first submission first.');
      // else {
      $scope.processing = true;
      $http.delete('/api/submissions/ignore/' + submission._id + '/' + $rootScope.password)
        .then(function(res) {
          var index = $scope.marketSubmissions.indexOf(submission);
          $scope.marketSubmissions.splice(index, 1);
          $scope.processing = false;
          // $scope.allowance--;
        })
        .then(null, function(err) {
          $scope.processing = false;
          $.Zebra_Dialog("ERROR: did not Ignore");
        });
    }
    // }

  $scope.openEmailClient = function(sub, item) {
    var toEmail = formatForEmailClient(item.toEmail, sub);
    var subject = (item.subject != undefined ? formatForEmailClient(item.subject, sub) : "");
    var body = (item.emailBody != undefined ? formatForEmailClient(item.emailBody, sub) : "");
    $window.open("mailto:" + encodeURIComponent(toEmail) + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body), "_self");
  }

  function formatForEmailClient(text, sub) {
    return text.replace(/{SUBMITTERS_EMAIL}/g, sub.email).replace(/{SUBMITTERS_NAME}/g, sub.name).replace(/{TRACK_TITLE_WITH_LINK}/g, sub.title + ' (' + sub.trackURL + ')').replace(/{TRACK_TITLE}/g, sub.title).replace(/{TRACK_ARTIST_WITH_LINK}/g, sub.trackArtist + ' (' + sub.trackArtistURL + ')').replace(/{TRACK_ARTIST}/g, sub.trackArtist).replace(/{SUBMITTED_TO_ACCOUNT_NAME}/g, sub.userID.soundcloud.username).replace(/{SUBMITTED_ACCOUNT_NAME_WITH_LINK}/g, sub.userID.soundcloud.username + ' (' + sub.userID.soundcloud.permalinkURL + ')').replace(/{TODAYSDATE}/g, new Date().toLocaleDateString());
  }

  $scope.getSubmissionByGenre = function() {
    $http.get('/api/submissions/getGroupedSubmissions').then(function(res) {
      var unacceptedSubmission = res.data;
      for (var i = 0; i < $scope.genreArray.length; i++) {
        for (var j = 0; j < unacceptedSubmission.length; j++) {
          if ($scope.genreArray[i] == unacceptedSubmission[j]._id) {
            $scope.genreArray[i] = $scope.genreArray[i] + ' (' + unacceptedSubmission[j].total_count + ')';
          }
        }
      }
    });
  }

  $scope.customEmailButtons = $scope.user.submissionsCustomEmailButtons.length > 0 ? $scope.user.submissionsCustomEmailButtons : [];
  if ($scope.customEmailButtons.length == 0) {
    $scope.customEmailButtons.push({
      toEmail: '',
      subject: '',
      emailBody: '',
      buttonText: '',
      buttonBgColor: ''
    });
  }
  $scope.saveSettings = function() {
    var valid = true;
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    angular.forEach($scope.customEmailButtons, function(cb) {
      if (!cb.toEmail.includes("{SUBMITTERS_EMAIL}")) {
        var validEmail = re.test(cb.toEmail);
        if (!validEmail || !cb.buttonText) {
          valid = false;
        }
      }
    });
    if (!valid) {
      $.Zebra_Dialog('Please enter {SUBMITTERS_EMAIL} or a well formatted email address in all To Email fields and a title for each button.');
      return;
    }
    $scope.processing = true;
    $scope.user.submissionsCustomEmailButtons = $scope.customEmailButtons;
    $http.post('/api/database/updateSubmissionsCustomEmailButtons', {
      customEmailButtons: $scope.user.submissionsCustomEmailButtons,
    }).then(function(res) {
      $scope.processing = false;
      SessionService.create(res.data);
      $scope.user = SessionService.getUser();
    });
  }

  $scope.addItem = function() {
    $scope.customEmailButtons.push({
      toEmail: '',
      subject: '',
      emailBody: '',
      buttonText: '',
      buttonBgColor: ''
    });
  }

  $http.get('/api/submissions/counts')
    .then(function(res) {
      $scope.counts = res.data
    })

  $scope.removeItem = function(index) {
    $scope.customEmailButtons.splice(index, 1);
  }

  $scope.addEventClass = function(index, type) {
    $('.selectedBox').removeClass("selectedBox");
    $("." + type + index).addClass("selectedBox");
  }

  $scope.appendBody = function(btn) {
    if ($('.selectedBox').length) {
      var boxIndex = $('.selectedBox').attr("index");
      var cursorPos = $('.selectedBox').prop('selectionStart');
      var v = $('.selectedBox').val();
      var textBefore = v.substring(0, cursorPos);
      var textAfter = v.substring(cursorPos, v.length);
      var newtext = textBefore + btn.appendText + textAfter;
      $('.selectedBox').val(newtext);
      $('.selectedBox').trigger('input')
      $('.selectedBox').removeClass("selectedBox");
    }
  }

  $scope.getPaidRepostAccounts = function() {
    $http.get('/api/submissions/getPaidRepostAccounts').then(function(res) {
      $scope.paidRepostAccounts = res.data;
      for (var i = 0; i < $scope.paidRepostAccounts.length; i++) {
        $scope.paidRepostAccounts[i].groups.forEach(function(acc) {
          if (acc != "" && $scope.uniqueGroup.indexOf(acc) === -1) {
            $scope.uniqueGroup.push(acc);
          }
        });
      }
    });
  }

  /*Sold Reposts*/

  $scope.getSoldReposts = function() {
    $http.post('/api/submissions/getSoldReposts', {
      lowDate: $scope.lowDate,
      highDate: $scope.highDate
    }).then(function(res) {
      $scope.adminStats.mpEarnings = 0;
      $scope.adminStats.subEarnings = 0;
      $scope.adminStats.earnings = 0;
      $scope.adminStats.refunds = 0;
      $scope.adminStats.refundAmount = 0;
      $scope.adminStats.future = 0;
      res.data.forEach(function(el) {
        try {
          if (el.data.payout) {
            if (el.data.payout.batch_header) {
              el.payout = "$" + new Number(el.data.payout.batch_header.amount.value).toFixed(2) + " Earned";
              if (el.marketplace) $scope.adminStats.mpEarnings += new Number(el.data.payout.batch_header.amount.value);
              else $scope.adminStats.subEarnings += new Number(el.data.payout.batch_header.amount.value);
              $scope.adminStats.earnings += new Number(el.data.payout.batch_header.amount.value);
            } else {
              el.payout = "$" + new Number(el.data.payout.amount.total).toFixed(2) + " Refunded";
              $scope.adminStats.refunds += 1;
              $scope.adminStats.refundAmount += new Number(el.data.payout.amount.total);
            }
          } else {
            el.payout = "Incomplete"
            $scope.adminStats.future += 1;
          }
        } catch (e) {
          console.log(e)
        };
        el.shareLink = window.location.origin + "/repostevents/" + el.user.soundcloud.pseudoname + "/" + el.data.pseudoname;
      })
      res.data.sort(function(a, b) {
        return new Date(b.data.day) - new Date(a.data.day);
      })
      $scope.soldReposts = res.data;
      $scope.adminStats.soldReposts = res.data.length;
    });
    $scope.sortType = 'name';
    $scope.sortReverse = false;
    $scope.searchTerm = '';
  }


  $scope.getSubmissionData = function() {
    $http.post('/api/submissions/submissionData', {
      lowDate: $scope.lowDate,
      highDate: $scope.highDate
    }).then(function(res) {
      $scope.adminStats.repSubCount = res.data.directSubs.length;
      $scope.adminStats.premSubCount = res.data.premiereSubs.length;
      var directSubAmounts = {};
      $scope.adminStats.ffEarnings = 0;
      res.data.directSubs.forEach(function(el) {
        if (!!directSubAmounts[el.sub.userID]) directSubAmounts[el.sub.userID] += 1;
        else directSubAmounts[el.sub.userID] = 1;
        $scope.adminStats.ffEarnings += !!el.ffEarnings ? el.ffEarnings : 0;
      })
      var premiereSubAmounts = {};
      res.data.premiereSubs.forEach(function(el) {
        if (!!premiereSubAmounts[el.userID]) premiereSubAmounts[el.userID] += 1;
        else premiereSubAmounts[el.userID] = 1;
      })
      $scope.accounts = res.data.accounts;
      $scope.accounts.forEach(function(acct) {
        acct.repSubCount = !!directSubAmounts[acct.userID._id] ? directSubAmounts[acct.userID._id] : 0;
        acct.premSubCount = !!premiereSubAmounts[acct.userID._id] ? premiereSubAmounts[acct.userID._id] : 0;
        // acct.paidSubs = 0;
        // acct.acceptedSubs = 0;
        // res.data.acceptedSubs.forEach(function(el) {
        //   if (el.channelIDS.includes(acct.userID.soundcloud.id) || el.pooledChannelIDS.includes(acct.userID.soundcloud.id)) {
        //     acct.acceptedSubs++;
        //   }
        //   var found = false;
        //   el.paidPooledChannels.forEach(function(chan) {
        //     if (chan.user.id == acct.userID.soundcloud.id) found = true;
        //   })
        //   el.paidChannels.forEach(function(chan) {
        //     if (chan.user.id == acct.userID.soundcloud.id) found = true;
        //   })
        //   if (found) acct.paidSubs++;
        // })
        // acct.payAcceptRatio = acct.paidSubs / acct.acceptedSubs * 100;

      })

      function getAcctReposts() {
        setTimeout(function() {
          if ($scope.soldReposts) {
            $scope.adminStats.earnings += $scope.adminStats.ffEarnings;
            var reposts = {};
            $scope.soldReposts.forEach(function(el) {
              if (!!reposts[el.data.userID]) reposts[el.data.userID].push(el)
              else reposts[el.data.userID] = [el];
            });
            $scope.accounts.forEach(function(acct) {
              acct.repostCount = !!reposts[acct.userID.soundcloud.id] ? reposts[acct.userID.soundcloud.id].length : 0;
              acct.earnings = 0;
              acct.refunds = 0;
              acct.refundAmount = 0;
              acct.future = 0;
              if (!!reposts[acct.userID.soundcloud.id]) {
                reposts[acct.userID.soundcloud.id].forEach(function(el) {
                  if (el.data.payout) {
                    if (el.data.payout.batch_header) {
                      acct.earnings += new Number(el.data.payout.batch_header.amount.value);
                    } else {
                      acct.refunds += 1;
                      acct.refundAmount += new Number(el.data.payout.amount.total);
                    }
                  } else {
                    acct.future += 1;
                  }
                });
              }
            })
            if (!$scope.$$phase) $scope.$apply();
          } else getAcctReposts();
        }, 500);
      }
      getAcctReposts();
    })
  }

  $scope.recalculate = function() {
    $scope.soldReposts = undefined;
    $scope.accounts = undefined;
    $scope.adminStats = {};
    $scope.getSoldReposts();
    $scope.getSubmissionData();
  }

  $scope.changeScale = function() {
    console.log($scope.scale);
    $scope.highDate = new Date();
    $scope.lowDate = new Date(new Date().getTime() - parseInt($scope.scale) * 24 * 3600000);
    $scope.recalculate();
  }
  $scope.incrementRange = function() {
    $scope.highDate = new Date($scope.highDate.getTime() + parseInt($scope.scale) * 24 * 3600000);
    $scope.lowDate = new Date($scope.lowDate.getTime() + parseInt($scope.scale) * 24 * 3600000);
    $scope.recalculate();
  }
  $scope.decrementRange = function() {
    $scope.highDate = new Date($scope.highDate.getTime() - parseInt($scope.scale) * 24 * 3600000);
    $scope.lowDate = new Date($scope.lowDate.getTime() - parseInt($scope.scale) * 24 * 3600000);
    $scope.recalculate();
  }
  $scope.scale = "7";
  $scope.changeScale();

  $scope.getPaidRepostAccounts();
  $scope.loadSubmissions();
  $scope.loadMarketSubmissions();

  $scope.getDiffTimeText = function(date) {
    var t = Math.floor((new Date(date).getTime() - new Date().getTime()) / 1000);
    var days, hours, minutes, seconds;
    hours = (Math.floor(t / 3600));
    t -= hours * 3600;
    minutes = (Math.floor(t / 60));

    return [
      hours + 'h',
      minutes + 'm'
    ].join(' ');
  }

  // $http.get('/api/submissions/currentAllowance')

  //   .then(function(res) {
  //     $scope.allowance = res.data.allowance;
  //     if (!$scope.$$phase) $scope.$apply();
  //   }).then(null, console.log);
});
