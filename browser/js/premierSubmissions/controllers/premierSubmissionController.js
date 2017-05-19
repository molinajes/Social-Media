app.config(function($stateProvider) {
  $stateProvider.state('premiersubmissions', {
    url: '/admin/premiersubmissions',
    templateUrl: 'js/premierSubmissions/views/premierSubmissions.html',
    controller: 'PremierSubmissionController'
  });
});

app.controller('PremierSubmissionController', function($rootScope, $state, $scope, $http, AuthService, SessionService, $sce, $window) {
  $scope.isLoggedIn = SessionService.getUser() ? true : false;
  if (!SessionService.getUser()) {
    $state.go('admin');
  }
  $scope.channelSelect = "all";
  $scope.user = SessionService.getUser();
  $scope.user.isAdmin = $scope.user.role == 'admin' ? true : false;
  $scope.viewStatus = 'new';
  $scope.counter = 0;
  $scope.channels = [];
  $scope.selectedGroups = [];
  $scope.showingElements = [];
  $scope.submissions = [];
  $scope.selectedChannelIDS = [];
  $scope.selectedGroupChannelIDS = [];
  $scope.selectedChannelName = [];
  $scope.paidRepostAccounts = [];
  $scope.genre = "";
  $scope.limit = 20;
  $scope.dynamicButton = [{
    "name": "FILE",
    "appendText": " {TRACK_FILE} "
  }, {
    "name": "TRACK LINK",
    "appendText": " {TRACK_LINK} "
  }, {
    "name": "SUBMITTERS EMAIL",
    "appendText": " {SUBMITTERS_EMAIL} "
  }, {
    "name": "SUBMITTERS NAME",
    "appendText": " {SUBMITTERS_NAME} "
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

  if (window.location.href.indexOf('admin/premiersubmissions#mysubmissions') != -1) {
    $('.nav-tabs a[href="#mysubmissions"]').tab('show');
  } else if (window.location.href.indexOf('admin/premiersubmissions#managesubmissions') != -1) {
    $('.nav-tabs a[href="#managesubmissions"]').tab('show');
  }

  $scope.changeChannelSelect = function() {
    $scope.showingElements = [];
    $scope.loadSubmissions();
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
  $scope.getPaidRepostAccounts();

  $scope.loadSubmissions = function() {
    $scope.processing = true;
    $http.get('/api/premier/unaccepted?genre=' + $scope.genre + "&skip=" + $scope.showingElements.length + "&limit=" + $scope.limit + "&userID=" + $scope.channelSelect + "&status=" + $scope.viewStatus)
      .then(function(res) {
        $scope.processing = false;
        if (res.data.length > 0) {
          angular.forEach(res.data, function(d) {
            d.channel = null;
            d.emailBody = "";
            $scope.showingElements.push(d);
          });
        }
      })
      .then(null, function(err) {
        $scope.processing = false;
        $.Zebra_Dialog('Error: No premiere submissions found.')
        console.log(err);
      });
  }

  $scope.loadMore = function() {
    $scope.loadSubmissions();
  }

  $scope.accept = function(submi) {
    $scope.processing = true;
    submi.status = "saved";
    $http.put("/api/premier/accept", {
        submi: submi
      })
      .then(function(sub) {
        $scope.processing = false;
      })
      .then(null, function(err) {
        $scope.processing = false;
        $.Zebra_Dialog(err.data);
      })
  }

  $scope.decline = function(submission) {
    $scope.processing = true;
    submission.status = "declined";
    $http.put('/api/premier/decline', {
        submission: submission
      })
      .then(function(res) {
        var index = $scope.showingElements.indexOf(submission);
        $scope.showingElements.splice(index, 1);
        $.Zebra_Dialog("Declined");
        $scope.processing = false
      })
      .then(null, function(err) {
        $scope.processing = false;
        $.Zebra_Dialog("ERROR: did not Decline");
      });
  }

  $scope.delete = function(submission) {
    $scope.processing = true;
    $http.post("/api/premier/delete", {
        id: submission._id
      })
      .then(function(sub) {
        $scope.showingElements.splice($scope.showingElements.indexOf(submission), 1);
        $scope.processing = false;
      })
      .then(null, function(err) {
        $.Zebra_Dialog(err.data);
        $scope.processing = false;
      });
  }

  $scope.customEmailButtons = $scope.user.premierCustomEmailButtons.length > 0 ? $scope.user.premierCustomEmailButtons : [];
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
    $scope.user.premierCustomEmailButtons = $scope.customEmailButtons;
    $http.post('/api/database/updatePremierCustomEmailButtons', {
      customEmailButtons: $scope.user.premierCustomEmailButtons,
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

  $scope.sendTestMail = function(index) {
    $scope.emailIndex = index;
    $scope.testEmail("testemail@artistsunlimited.com");
    // $scope.showTestEmailModal = true;

    // $('#emailModal').modal('show');
  }

  $scope.testEmail = function(email) {
    // $scope.showTestEmailModal = false;
    // $('#emailModal').modal('hide');
    var subject = $scope.customEmailButtons[$scope.emailIndex].subject;
    var body = $scope.customEmailButtons[$scope.emailIndex].emailBody;
    body = formatForTestEmail(body, email);
    subject = formatForTestEmail(subject, email);
    $window.open("mailto:" + email + "?body=" + body + "&subject=" + subject, "_self");
  }

  function formatForTestEmail(item, email) {
    return encodeURIComponent(item.replace(/{SUBMITTERS_EMAIL}/g, email).replace(/{SUBMITTERS_NAME}/g, "Johnny Submitter").replace(/{TRACK_LINK}/g, "https://soundcloud.com/david-austin-music/like-me-slightly-max-milner").replace(/{TRACK_FILE}/g, "https://premiersubmissions.s3.amazonaws.com/40%20When%20You%20Leave%20%28Numa%20Numa%29%20%28Basshunter%20Remix%29_1461703460790.mp3").replace(/{SUBMITTED_TO_ACCOUNT_NAME}/g, "La Tropical").replace(/{SUBMITTED_ACCOUNT_NAME_WITH_LINK}/g, 'La Tropical (https://soundcloud.com/latropical)').replace('{TODAYSDATE}', new Date().toLocaleDateString()));
  }

  $scope.openEmailClient = function(sub, item) {
    var toEmail = formatForEmailClient(item.toEmail, sub);
    var subject = (item.subject != undefined ? formatForEmailClient(item.subject, sub) : "");
    var body = (item.emailBody != undefined ? formatForEmailClient(item.emailBody, sub) : "");
    $window.open("mailto:" + encodeURIComponent(toEmail) + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body), "_self");
  }

  function formatForEmailClient(text, sub) {
    return (text.replace(/{SUBMITTERS_EMAIL}/g, sub.email).replace(/{SUBMITTERS_NAME}/g, sub.name).replace(/{TRACK_LINK}/g, sub.trackLink).replace(/{TRACK_FILE}/g, sub.s3URL).replace(/{SUBMITTED_TO_ACCOUNT_NAME}/g, sub.userID.soundcloud.username).replace(/{SUBMITTED_ACCOUNT_NAME_WITH_LINK}/g, sub.userID.soundcloud.username + ' (' + sub.userID.soundcloud.permalinkURL + ')').replace('{TODAYSDATE}', new Date().toLocaleDateString()));
  }

  $scope.loadSubmissions();
});

app.filter('trusted', ['$sce', function($sce) {
  return function(url) {
    return $sce.trustAsResourceUrl(url);
  };
}]);
