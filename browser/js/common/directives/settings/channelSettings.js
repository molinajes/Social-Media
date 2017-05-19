app.directive('channelsettings', function($http) {
  return {
    templateUrl: 'js/common/directives/settings/channelSettings.html',
    restrict: 'E',
    scope: false,
    controller: function channelSettingsController($rootScope, $state, $scope, $http, $window, AccountSettingServices, SessionService) {
      var commentIndex = 0;
      $scope.saveRepostSettings = function(type) {
        if (type == 'paid') {
          AccountSettingServices.updateAdminProfile({
              repostSettings: $scope.user.repostSettings
            })
            .then(function(res) {
              $scope.processing = false;
            })
            .catch(function() {});
        } else {
          $http.put('/api/database/updateRepostSettings', {
            repostSettings: $scope.AccountsStepData.repostSettings,
            id: $scope.AccountsStepData.submissionData.userID
          }).then(function(res) {
            SessionService.createAdminUser($scope.AccountsStepData);
          });
        }
      }

      if (window.location.href.indexOf('admin/channel/step1#submissionUrl') != -1) {
        $('.nav-tabs a[href="#submissionUrl"]').tab('show');
      } else if (window.location.href.indexOf('admin/channel/step1#setPrice') != -1) {
        $('.nav-tabs a[href="#setPrice"]').tab('show');
      } else if (window.location.href.indexOf('admin/channel/step1#customSubmission') != -1) {
        $('.nav-tabs a[href="#customSubmission"]').tab('show');
      } else if (window.location.href.indexOf('admin/channel/step1#customPremiereSubmission') != -1) {
        $('.nav-tabs a[href="#customPremiereSubmission"]').tab('show');
      } else if (window.location.href.indexOf('admin/channel/step1#repostPreferences') != -1) {
        $('.nav-tabs a[href="#repostPreferences"]').tab('show');
      } else if (window.location.href.indexOf('admin/channel/step1#manageReposts') != -1) {
        $('.nav-tabs a[href="#manageReposts"]').tab('show');
      }

      $scope.finish = function() {
        $http.get('/api/users/byID/' + $scope.AccountsStepData.submissionData.userID).then(function(res) {
          $window.localStorage.setItem('prevATUser', JSON.stringify(res.data))
          window.location.href = window.location.origin + "/admin/accounts";
        }).then(null, console.log)
      }

      $scope.defaultsRep = function() {
        var oldId = $scope.AccountsStepData.postData._id;
        $scope.AccountsStepData.postData = JSON.parse(JSON.stringify($scope.defaultSubmitPage));
        $scope.AccountsStepData.postData.heading.text = "Submission for Repost";
        $scope.AccountsStepData.postData.logo.images = $scope.AccountsStepData.postData.background.images = $scope.AccountsStepData.submissionData.avatarURL;
        $scope.AccountsStepData.postData.type = "submit";
        $scope.AccountsStepData.postData._id = oldId;
      }

      $scope.defaultsPrem = function() {
        var oldId = $scope.AccountsStepData.premier._id;
        $scope.AccountsStepData.premier = JSON.parse(JSON.stringify($scope.defaultSubmitPage));
        $scope.AccountsStepData.premier.heading.text = "Submission for Premiere";
        $scope.AccountsStepData.premier.logo.images = $scope.AccountsStepData.premier.background.images = $scope.AccountsStepData.submissionData.avatarURL;
        $scope.AccountsStepData.premier.type = "premiere";
        $scope.AccountsStepData.premier._id = oldId;
      }

      $scope.undoRep = function() {
        console.log($scope.AccountsStepData.postData._id);
        if (!$scope.AccountsStepData.postData._id) {
          $scope.defaultsRep();
        } else {
          $http.get('/api/customSubmissions/getCustomSubmission/' + $scope.AccountsStepData.postData.userID + '/' + $scope.AccountsStepData.postData.type)
            .then(function(res) {
              console.log(res.data);
              $scope.AccountsStepData.postData = res.data;
            })
        }
      }

      $scope.undoPrem = function() {
        if (!$scope.AccountsStepData.premier._id) {
          $scope.defaultsPrem();
        } else {
          $http.get('/api/customSubmissions/getCustomSubmission/' + $scope.AccountsStepData.premier.userID + '/' + $scope.AccountsStepData.premier.type)
            .then(function(res) {
              $scope.AccountsStepData.premier = res.data;
            })
        }
      }

      $scope.matchRep = function() {
        var oldId = $scope.AccountsStepData.premier._id;
        var saveHeading = $scope.AccountsStepData.premier.heading.text;
        var saveSubheading = $scope.AccountsStepData.premier.subHeading.text;
        $scope.AccountsStepData.premier = $scope.AccountsStepData.postData;
        $scope.AccountsStepData.premier.heading.text = saveHeading;
        $scope.AccountsStepData.premier.subHeading.text = saveSubheading;
        $scope.AccountsStepData.premier._id = oldId;
        $scope.AccountsStepData.premier.type = "premiere";
      }

      $scope.enableTemplate = function(template, type) {
        if (type == 'submit') {
          var oldId = $scope.AccountsStepData.postData._id;
          var saveHeading = $scope.AccountsStepData.postData.heading.text;
          var saveSubheading = $scope.AccountsStepData.postData.subHeading.text;
          var saveBG = $scope.AccountsStepData.postData.background.images;
          var saveLogo = $scope.AccountsStepData.postData.logo.images;
          $scope.AccountsStepData.postData = JSON.parse(JSON.stringify(template));
          $scope.AccountsStepData.postData.logo.images = saveLogo;
          $scope.AccountsStepData.postData.background.images = saveBG;
          $scope.AccountsStepData.postData.heading.text = saveHeading;
          $scope.AccountsStepData.postData.subHeading.text = saveSubheading;
          $scope.AccountsStepData.postData.type = "submit";
          $scope.AccountsStepData.postData._id = oldId;
        } else {
          var oldId = $scope.AccountsStepData.premier._id;
          var saveHeading = $scope.AccountsStepData.premier.heading.text;
          var saveSubheading = $scope.AccountsStepData.premier.subHeading.text;
          var saveBG = $scope.AccountsStepData.premier.background.images;
          var saveLogo = $scope.AccountsStepData.premier.logo.images;
          $scope.AccountsStepData.premier = JSON.parse(JSON.stringify(template));
          $scope.AccountsStepData.premier.logo.images = saveLogo;
          $scope.AccountsStepData.premier.background.images = saveBG;
          $scope.AccountsStepData.premier.heading.text = saveHeading;
          $scope.AccountsStepData.premier.subHeading.text = saveSubheading;
          $scope.AccountsStepData.premier.type = "submit";
          $scope.AccountsStepData.premier._id = oldId;
        }
      }

      $scope.deleteTemplate = function(ind) {
        $scope.processing = true;
        $scope.user.templates.splice(ind, 1);
        $http.post('/api/users/saveTemplates', $scope.user.templates)
          .then(function(res) {
            $scope.user.templates = res.data;
            $scope.processing = false;
          }).then(null, alert);
      }

      $scope.saveTemplate = function() {
        $scope.processing = true;
        if (!$scope.user.templates) $scope.user.templates = [];
        $scope.user.templates.push($scope.AccountsStepData.postData);
        $http.post('/api/users/saveTemplates', $scope.user.templates)
          .then(function(res) {
            $scope.user.templates = res.data;
            $scope.processing = false;
            $.Zebra_Dialog('Template Saved');
          }).then(null, alert);
      }

      $scope.saveComments = function(value, type, index) {
        var comments = [];
        if (type == 'paid' && value) {
          comments = ($scope.user.repostSettings.paid.comments ? $scope.user.repostSettings.paid.comments : []);
          if (index == undefined)
            comments.push(value);
          else
            comments[index] = value;

          $scope.user.repostSettings.paid.comments = comments;
          $scope.saveRepostSettings('paid');
          $scope.paidComment = "";
        } else if (type == 'schedule' && value) {
          comments = ($scope.AccountsStepData.repostSettings.schedule.comments ? $scope.AccountsStepData.repostSettings.schedule.comments : []);
          if (index == undefined)
            comments.push(value);
          else
            comments[index] = value;

          $scope.AccountsStepData.repostSettings.schedule.comments = comments;
          $scope.saveRepostSettings('schedule');
          $scope.scheduleComment = "";
        } else if (type == 'trade' && value) {
          comments = ($scope.AccountsStepData.repostSettings.trade.comments ? $scope.AccountsStepData.repostSettings.trade.comments : []);
          if (index == undefined)
            comments.push(value);
          else
            comments[index] = value;
          $scope.AccountsStepData.repostSettings.trade.comments = comments;
          $scope.saveRepostSettings('trade');
          $scope.tradeComment = "";
        } else {
          $.Zebra_Dialog("Please enter comment");
          return;
        }
      }

      $scope.editComments = function(comment, type, index) {
        $scope.scheduleCommentIndex = index;
        if (type == 'paid') {
          $('#paidCommentModal').modal('show');
          $scope.paidComment = comment;
        }
        if (type == 'schedule') {
          $('#scheduleCommentModal').modal('show');
          $scope.scheduleComment = comment;
        } else if (type == 'trade') {
          $('#tradeCommentModal').modal('show');
          $scope.tradeComment = comment;
        }
      }

      $scope.saveUser = function() {
        $scope.processing = true;
        $http.put("/api/database/profile", {
          queue: $scope.AccountsStepData.queue,
          _id: $scope.AccountsStepData.submissionData.userID
        }).then(function(res) {
          $scope.processing = false;
        }).then(null, function(err) {
          $.Zebra_Dialog("Error: did not save");
          $scope.processing = false;
        });
      }

      /*Repost settings end*/
      $scope.finishAdmin = function() {
        $state.go("accounts");
      }

      $scope.generateRandomNumber = function() {
        var min = 0.01,
          max = 0.09,
          numbers = (Math.random() * (max - min) + min).toFixed(2);
        return numbers
      }
      var daysArray = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      var defaultAvailableSlots = {
        'sunday': [1, 4, 8, 11, 14, 17, 20],
        'monday': [1, 4, 8, 11, 14, 17, 20],
        'tuesday': [1, 4, 8, 11, 14, 17, 20],
        'wednesday': [1, 4, 8, 11, 14, 17, 20],
        'thursday': [1, 4, 8, 11, 14, 17, 20],
        'friday': [1, 4, 8, 11, 14, 17, 20],
        'saturday': [1, 4, 8, 11, 14, 17, 20]
      };

      $scope.addGroup = function(val) {
        $scope.group = "";
        $("#group").val('');
        if ($scope.AccountsStepData.submissionData.groups == undefined) {
          $scope.AccountsStepData.submissionData.groups = [];
        }
        if ($scope.AccountsStepData.submissionData.groups != undefined && $scope.AccountsStepData.submissionData.groups.indexOf(val) == -1) {
          $scope.AccountsStepData.submissionData.groups.push(val);
        }
      }

      $scope.removeGroup = function(index) {
        if ($scope.AccountsStepData.submissionData.groups.length > 0) {
          $scope.AccountsStepData.submissionData.groups.splice(index, 1);
        }
      }

      $scope.isValidEmailAddress = function(emailAddress) {
        var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
        return pattern.test(emailAddress);
      };

      $scope.updateLOGOIMAGE = function(step) {
        $scope.processing = true;
        if ($scope.AccountsStepData.profilePicture != "" && step == 1) {
          if (!(typeof $scope.AccountsStepData.profilePicture === 'undefined')) {
            AccountSettingServices.uploadFile($scope.AccountsStepData.profilePicture).then(function(res) {
              if (res) {
                $scope.AccountsStepData.profilePicture = res.data.Location;
                $scope.processing = false;
              }
            });
          }
        } else if ($scope.AccountsStepData.postData != undefined && $scope.AccountsStepData.postData.logo.images != "" && step == 3) {
          if (!(typeof $scope.AccountsStepData.postData.logo.images === 'undefined')) {
            AccountSettingServices.uploadFile($scope.AccountsStepData.postData.logo.images).then(function(res) {
              if (res) {
                $scope.AccountsStepData.postData.logo.images = res.data.Location;
                $scope.processing = false;
              }
            });
          }
        } else if ($scope.AccountsStepData.premier != undefined && $scope.AccountsStepData.premier.logo.images != "" && step == 4) {
          if (!(typeof $scope.AccountsStepData.premier.logo.images === 'undefined')) {
            AccountSettingServices.uploadFile($scope.AccountsStepData.premier.logo.images).then(function(res) {
              if (res) {
                $scope.AccountsStepData.premier.logo.images = res.data.Location;
                $scope.processing = false;
              }
            });
          }
        } else {
          $scope.processing = false;
        }
      }

      $scope.updateBackgroundIMAGE = function(step) {
        $scope.processing = true;
        if ($scope.AccountsStepData.postData != undefined && $scope.AccountsStepData.postData.logo.images != "" && step == 3) {
          if (!(typeof $scope.AccountsStepData.postData.background.images === 'undefined')) {
            AccountSettingServices.uploadFile($scope.AccountsStepData.postData.background.images).then(function(res) {
              if (res) {
                $scope.AccountsStepData.postData.background.images = res.data.Location;
                $scope.processing = false;
              }
            });
          }
        } else if ($scope.AccountsStepData.premier != undefined && $scope.AccountsStepData.premier.background.images != "" && step == 4) {
          if (!(typeof $scope.AccountsStepData.premier.background.images === 'undefined')) {
            AccountSettingServices.uploadFile($scope.AccountsStepData.premier.background.images).then(function(res) {
              if (res) {
                $scope.AccountsStepData.premier.background.images = res.data.Location;
                $scope.processing = false;
              }
            });
          }
        } else {
          $scope.processing = false;
        }
      }

      $scope.soundcloudLogin = function() {
        if ($scope.AccountsStepData.submissionData == undefined) {
          $scope.AccountsStepData.submissionData = {};
        }
        $scope.processing = true;
        SC.connect().then(function(res) {
            $rootScope.accessToken = res.oauth_token;
            return $http.post('/api/login/soundCloudAuthentication', {
              token: res.oauth_token,
              password: 'test'
            });
          })
          .then(function(res) {
            var scInfo = {};
            scInfo.userID = res.data.user._id;
            $scope.paidRepostId = res.data.user._id;
            $scope.defaultSubmitPage.userID = scInfo.userID;
            $scope.AccountsStepData.postData = JSON.parse(JSON.stringify($scope.defaultSubmitPage));
            $scope.AccountsStepData.premier = JSON.parse(JSON.stringify($scope.defaultSubmitPage));
            $scope.AccountsStepData.postData.type = "submit";
            $scope.AccountsStepData.premier.type = "premiere";
            $scope.AccountsStepData.premier.heading.test = "Submission for Premiere";
            console.log($scope.AccountsStepData.postData)
            console.log($scope.AccountsStepData.premier);
            $scope.AccountsStepData.postData.logo.images = $scope.AccountsStepData.postData.background.images = $scope.AccountsStepData.premier.logo.images = $scope.AccountsStepData.premier.background.images = res.data.user.soundcloud.avatarURL;
            $scope.AccountsStepData.pseudoAvailableSlots = createPseudoAvailableSlots(res.data.user);
            $scope.AccountsStepData.astzOffset = res.data.user.astzOffset;
            $scope.AccountsStepData.repostSettings = res.data.user.repostSettings;
            console.log(res.data.user);
            AccountSettingServices.checkUsercount({
                "userID": scInfo.userID,
                'action': "id"
              })
              .then(function(result) {
                if (!result.data) {
                  scInfo.groups = [];
                  scInfo.description = "";
                  scInfo.price = 1;
                  $scope.AccountsStepData.submissionData = res.data.user.soundcloud;
                  $scope.AccountsStepData.submissionData.userID = res.data.user._id;
                  var username = res.data.user.soundcloud.permalinkURL.substring(res.data.user.soundcloud.permalinkURL.indexOf('.com/') + 5)
                  var url = window.location.origin + '/' + username + '/submit';
                  var premierurl = window.location.origin + '/' + username + '/premiere';
                  AccountSettingServices.checkUsercount({
                      "url": url,
                      'action': "url"
                    })
                    .then(function(result) {
                      if (result.data) {
                        url = window.location.origin + '/' + username + result.data + '/submit';
                        premierurl = window.location.origin + '/' + username + result.data + '/premiere';
                        $scope.AccountsStepData.submissionData.submissionUrl = url;
                        $scope.AccountsStepData.submissionData.premierUrl = premierurl;
                      } else {
                        $scope.AccountsStepData.submissionData.submissionUrl = url;
                        $scope.AccountsStepData.submissionData.premierUrl = premierurl;
                      }
                      scInfo.submissionUrl = url;
                      scInfo.premierUrl = premierurl;
                      $http.post('/api/database/updateUserAccount', {
                        soundcloudInfo: scInfo,
                      }).then(function(user) {
                        user.data.paidRepost.reverse();
                      });
                      $http.post('/api/database/profile/edit', {
                        userID: scInfo.userID,
                        admin: true
                      }).then(function(user) {

                      });
                      SessionService.createAdminUser($scope.AccountsStepData);
                      $scope.processing = false;
                      $scope.nextStep(2, $scope.AccountsStepData, 'channel')
                    }).then(null, function() {
                      console.log(err);
                      $.Zebra_Dialog("Error logging in")
                    })
                } else {
                  $.Zebra_Dialog('Error: This user already exists');
                  $scope.processing = false;
                  location.reload();
                }
              }).then(null, function() {
                console.log(err);
                $.Zebra_Dialog("Error logging in")
              })
          })
          .then(null, function(err) {
            console.log(err);
            $.Zebra_Dialog('Error: Could not log in');
            $scope.processing = false;
          });
      };

      $scope.isPaidRepost = function() {
        if ($scope.AccountsStepData.formActions == 'Edit') {
          $scope.activeTab = ['submissionUrl', 'setPrice', 'customSubmission', 'customPremiereSubmission', 'repostPreferences', 'manageReposts'];
        } else {
          $scope.activeTab = ['submissionUrl'];
        }
      }

      $scope.isPaidRepost();

      $scope.nextStep = function(step, currentData, type) {
        if (type == "channel") {
          switch (step) {
            case 1:
              $http.get("/connect/logout?return_to=https://soundcloud.com/connect?client_id=8002f0f8326d869668523d8e45a53b90&display=popup&redirect_uri=https://" + window.location.host + "/callback.html&response_type=code_and_token&scope=non-expiring&state=SoundCloud_Dialog_5fead");
              break;
            case 2:
              if (!$scope.AccountsStepData.price) $scope.AccountsStepData.price = Math.max(Math.floor($scope.AccountsStepData.submissionData.followers / 3000), 7);
              SessionService.createAdminUser($scope.AccountsStepData);
              $scope.activeTab.push('setPrice');
              $('.nav-tabs a[href="#setPrice"]').tab('show');
              break;
            case 3:
              var next = true;
              if ($scope.AccountsStepData.price < 6 || $scope.AccountsStepData.price == undefined) {
                next = false;
                $scope.AccountsStepData.price = 6;
                $.Zebra_Dialog('Please enter a price (minimum $6).');
                return;
              }
              if (next) {
                AccountSettingServices.updatePaidRepost({
                    userID: $scope.AccountsStepData.submissionData.userID,
                    price: $scope.AccountsStepData.price,
                    description: $scope.AccountsStepData.description,
                    groups: $scope.AccountsStepData.submissionData.groups ? $scope.AccountsStepData.submissionData.groups : [],
                    submissionUrl: $scope.AccountsStepData.submissionData.submissionUrl,
                    premierUrl: $scope.AccountsStepData.submissionData.premierUrl
                  })
                  .then(function(res) {
                    $scope.activeTab.push('customSubmission');
                    $('.nav-tabs a[href="#customSubmission"]').tab('show');
                    SessionService.createAdminUser($scope.AccountsStepData);
                  })
                  .catch(function() {});
              } else {
                return;
              }
              break;
            case 4:
              AccountSettingServices.addCustomize({
                  userID: $scope.AccountsStepData.submissionData.userID,
                  type: 'submit',
                  background: $scope.AccountsStepData.postData.background,
                  logo: $scope.AccountsStepData.postData.logo,
                  heading: $scope.AccountsStepData.postData.heading,
                  subHeading: $scope.AccountsStepData.postData.subHeading,
                  inputFields: $scope.AccountsStepData.postData.inputFields,
                  button: $scope.AccountsStepData.postData.button,
                  layout: $scope.AccountsStepData.postData.layout
                })
                .then(function(res) {
                  $scope.activeTab.push('customPremiereSubmission');
                  $('.nav-tabs a[href="#customPremiereSubmission"]').tab('show');
                  SessionService.createAdminUser($scope.AccountsStepData);
                })
                .catch(function() {});
              break;
            case 5:
              AccountSettingServices.addCustomize({
                  userID: $scope.AccountsStepData.submissionData.userID,
                  type: 'premiere',
                  background: $scope.AccountsStepData.premier.background,
                  logo: $scope.AccountsStepData.premier.logo,
                  heading: $scope.AccountsStepData.premier.heading,
                  subHeading: $scope.AccountsStepData.premier.subHeading,
                  inputFields: $scope.AccountsStepData.premier.inputFields,
                  button: $scope.AccountsStepData.premier.button,
                  layout: $scope.AccountsStepData.premier.layout
                })
                .then(function(res) {
                  $scope.finish();
                  // if ($scope.AccountsStepData.pseudoAvailableSlots == undefined) $scope.AccountsStepData.pseudoAvailableSlots = defaultAvailableSlots;
                  // if (!$scope.AccountsStepData.astzOffset) $scope.AccountsStepData.astzOffset = -300;
                  // SessionService.createAdminUser($scope.AccountsStepData);
                  // $scope.activeTab.push('repostPreferences');
                  // $('.nav-tabs a[href="#repostPreferences"]').tab('show');
                })
                .then(null, alert);
              break;
            case 6:
              //update from pseudo
              $scope.AccountsStepData.availableSlots = createAvailableSlots($scope.AccountsStepData, $scope.AccountsStepData.pseudoAvailableSlots)
              AccountSettingServices.updateUserAvailableSlot({
                  _id: $scope.AccountsStepData.submissionData.userID,
                  availableSlots: $scope.AccountsStepData.availableSlots
                })
                .then(function(res) {
                  $scope.processing = false;
                  $scope.AccountsStepData.queue = res.data.queue;
                  $scope.loadQueueSongs();
                  $scope.activeTab.push('manageReposts');
                  $('.nav-tabs a[href="#manageReposts"]').tab('show');
                })
                .catch(function() {});
              break;
            case 7:
              SessionService.removeAccountusers($scope.AccountsStepData);
              // $state.go("accounts");
              break;
          }
        }
      }

      $scope.openModal = function(type) {
        if (type === 'paid') {
          $('#paidCommentModal').modal('show');
        }
      }

      $scope.setSlotStyle = function(day, hour) {
        var style = {};
        if ($scope.AccountsStepData.pseudoAvailableSlots != undefined) {
          if ($scope.AccountsStepData.pseudoAvailableSlots[daysArray[day]] != undefined && $scope.AccountsStepData.pseudoAvailableSlots[daysArray[day]].indexOf(hour) > -1) {
            style = {
              'background-color': "#fff",
              'border-color': "#999"
            };
          }
        }
        return style;
      }

      $scope.tooManyReposts = function(day, hour) {
        var startDayInt = (day + 6) % 7;
        var allSlots = []
        var wouldBeSlots = JSON.parse(JSON.stringify($scope.AccountsStepData.pseudoAvailableSlots));
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
            if (Math.abs(checkingSlots[i] - slot) > 24) checkingSlots.splice(i, 1);
            else i++;
          }
          checkingSlots.push(slot);
          if (checkingSlots.length > 10) {
            status = true;
          }
        })
        return status;
      }

      $scope.clickedSlotsave = function(day, hour) {
        var pushhour = parseInt(hour);
        if ($scope.AccountsStepData.pseudoAvailableSlots != undefined && $scope.AccountsStepData.pseudoAvailableSlots[daysArray[day]].indexOf(pushhour) > -1) {
          $scope.AccountsStepData.pseudoAvailableSlots[daysArray[day]].splice($scope.AccountsStepData.pseudoAvailableSlots[daysArray[day]].indexOf(pushhour), 1);
        } else if ($scope.tooManyReposts(day, hour)) {
          $.Zebra_Dialog("Cannot enable slot. We only allow 10 reposts within 24 hours to prevent you from being repost blocked.");
          return;
        } else if ($scope.AccountsStepData.pseudoAvailableSlots != undefined) {
          $scope.AccountsStepData.pseudoAvailableSlots[daysArray[day]].push(pushhour);
        }
      }

      $scope.updateCustomLogoImage = function() {
        $scope.processing = true;
        if ($scope.AccountsStepData.postData != undefined && $scope.AccountsStepData.postData.logo.images != "") {
          if (!(typeof $scope.AccountsStepData.postData.logo.images === 'undefined')) {
            AccountSettingServices.uploadFile($scope.AccountsStepData.postData.logo.images).then(function(res) {
              if (res) {
                $scope.AccountsStepData.postData.logo.images = res.data.Location;
                $scope.processing = false;
              }
            });
          }
        } else {
          $scope.processing = false;
        }
      }

      $scope.updatePremierLogoImage = function() {
        $scope.processing = true;
        if ($scope.AccountsStepData.premier != undefined && $scope.AccountsStepData.premier.logo.images != "") {
          if (!(typeof $scope.AccountsStepData.premier.logo.images === 'undefined')) {
            AccountSettingServices.uploadFile($scope.AccountsStepData.premier.logo.images).then(function(res) {
              if (res) {
                $scope.AccountsStepData.premier.logo.images = res.data.Location;
                $scope.processing = false;
              }
            });
          }
        } else {
          $scope.processing = false;
        }
      }

      $scope.uploadCustomBackground = function() {
          $scope.processing = true;
          if ($scope.AccountsStepData.postData != undefined && $scope.AccountsStepData.postData.background.images != "") {
            if (!(typeof $scope.AccountsStepData.postData.background.images === 'undefined')) {
              AccountSettingServices.uploadFile($scope.AccountsStepData.postData.background.images).then(function(res) {
                if (res) {
                  $scope.AccountsStepData.postData.background.images = res.data.Location;
                  $scope.processing = false;
                }
              });
            }
          } else {
            $scope.processing = false;
          }
        }
        // $scope.fontFam = "'Aref Ruqaa', cursive";
      $scope.uploadPremierBackground = function() {
        $scope.processing = true;
        if ($scope.AccountsStepData.premier != undefined && $scope.AccountsStepData.premier.background.images != "") {
          if (!(typeof $scope.AccountsStepData.premier.background.images === 'undefined')) {
            AccountSettingServices.uploadFile($scope.AccountsStepData.premier.background.images).then(function(res) {
              if (res) {
                $scope.AccountsStepData.premier.background.images = res.data.Location;
                $scope.processing = false;
              }
            });
          }
        } else {
          $scope.processing = false;
        }
      }

      $scope.changeFont = function(fnt, title) {
        $scope[fnt] = title;
      }

      $scope.fontFamilies = [{
        title: "Aref Ruqaa",
        css: "'Aref Ruqaa', serif"
      }, {
        title: "Open Sans",
        css: "'Open Sans', sans-serif"
      }, {
        title: "Space Mono",
        css: "'Space Mono', monospace"
      }, {
        title: "Roboto Slab",
        css: "'Roboto Slab', serif"
      }, {
        title: "Merriweather",
        css: "'Merriweather', serif"
      }, {
        title: "Molle",
        css: "'Molle', cursive"
      }, {
        title: "Playfair Display",
        css: "'Playfair Display', serif"
      }, {
        title: "Indie Flower",
        css: "'Indie Flower', cursive"
      }, {
        title: "Nova Script",
        css: "'Nova Script', cursive"
      }, {
        title: "Inconsolata",
        css: "'Inconsolata', monospace"
      }, {
        title: "Lobster",
        css: "'Lobster', cursive"
      }, {
        title: "Arvo",
        css: "'Arvo', serif"
      }, {
        title: "Yanone Kaffeesatz",
        css: "'Yanone Kaffeesatz', sans-serif"
      }, {
        title: "Abel",
        css: "'Abel', sans-serif"
      }, {
        title: "Gloria Hallelujah",
        css: "'Gloria Hallelujah', cursive"
      }, {
        title: "Pacifico",
        css: "'Pacifico', cursive"
      }, {
        title: "Bungee",
        css: "'Bungee', cursive"
      }, {
        title: "Exo",
        css: "'Exo', sans-serif"
      }, {
        title: "Shadows Into Light",
        css: "'Shadows Into Light', cursive"
      }, {
        title: "Dancing Script",
        css: "'Dancing Script', cursive"
      }, {
        title: "Play",
        css: "'Play', sans-serif"
      }, {
        title: "Amatic SC",
        css: "'Amatic SC', cursive"
      }, {
        title: "Poiret One",
        css: "'Poiret One', cursive"
      }, {
        title: "Orbitron",
        css: "'Orbitron', sans-serif"
      }, {
        title: "Sahitya",
        css: "'Sahitya', serif"
      }, {
        title: "Architects Daughter",
        css: "'Architects Daughter', cursive"
      }, {
        title: "Acme",
        css: "'Acme', sans-serif"
      }, {
        title: "Cinzel",
        css: "'Cinzel', serif"
      }, {
        title: "Josefin Slab",
        css: "'Josefin Slab', serif"
      }, {
        title: "Lobster Two",
        css: "'Lobster Two', cursive"
      }, {
        title: "Permanent Marker",
        css: "'Permanent Marker', cursive"
      }, {
        title: "Chewy",
        css: "'Chewy', cursive"
      }, {
        title: "Special Elite",
        css: "'Special Elite', cursive"
      }, {
        title: "Calligraffitti",
        css: "'Calligraffitti', cursive"
      }, {
        title: "Ceviche One",
        css: "'Ceviche One', cursive"
      }, {
        title: "Press Start 2P",
        css: "'Press Start 2P', cursive"
      }, {
        title: "Cinzel Decorative",
        css: "'Cinzel Decorative', cursive"
      }]
    }
  }
});
