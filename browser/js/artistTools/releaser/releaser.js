app.config(function($stateProvider) {
  $stateProvider
    .state('releaser', {
      url: '/artistTools/releaser',
      templateUrl: 'js/artistTools/releaser/releaseList.html',
      controller: 'ReleaserController',
      resolve: {
        posts: function() {
          return [];
        }
      }
    })
    .state('releaserNew', {
      url: '/artistTools/releaser/new',
      templateUrl: 'js/artistTools/releaser/releaser.html',
      controller: 'ReleaserController',
      resolve: {
        posts: function() {
          return [];
        }
      }
    })
    .state('releaserEdit', {
      url: '/artistTools/releaser/edit/:releaseID',
      templateUrl: 'js/artistTools/releaser/releaser.html',
      controller: 'ReleaserController',
      resolve: {
        posts: function() {
          return [];
        }
      }
    })
});

app.controller('ReleaserController', function($rootScope, $scope, posts, StorageFactory, BroadcastFactory, $state, SessionService, $stateParams, $window, $http) {
  $scope.user = SessionService.getUser();
  if (!$scope.user) {
    $state.go('login');
    return;
  }

  var date = new Date();
  $scope.currentDate = date.toISOString().slice(0, 10).replace(/-/g, "-");

  function getDayClass(data) {
    var date = data.date,
      mode = data.mode;
    if (mode === 'day') {
      var dayToCheck = new Date(date).setHours(0, 0, 0, 0);
      for (var i = 0; i < $scope.events.length; i++) {
        var currentDay = new Date($scope.events[i].date).setHours(0, 0, 0, 0);
        if (dayToCheck === currentDay) {
          return $scope.events[i].status;
        }
      }
    }
    return '';
  }

  $scope.inlineOptions = {
    customClass: getDayClass,
    showWeeks: true
  };

  $scope.dateOptions = {
    startingDay: 1
  };

  $scope.open1 = function() {
    $scope.popup1.opened = true;
  };

  $scope.popup1 = {
    opened: false
  };

  $scope.postData = {};
  $scope.audio = {};
  $scope.video = {};
  $scope.image = {};
  var oldPostData = {};
  $scope.posts = posts;

  var audioSelectionChanged = function() {
    if ($scope.audio.file) {
      return $scope.audio.file.name && (oldPostData.awsAudioKeyName !== $scope.audio.file.name);
    }
  };

  var videoSelectionChanged = function() {
    if ($scope.video.file) {
      return $scope.video.file.name && (oldPostData.awsVideoKeyName !== $scope.video.file.name);
    }
  };

  var imageSelectionChanged = function() {
    if ($scope.image.file) {
      return $scope.image.file.name && (oldPostData.awsImageKeyName !== $scope.image.file.name);
    }
  };

  $scope.savePost = function() {
    if (!$scope.postData._id) {
      return addPost();
    }
    // audio ,video and image are being changed
    else if (audioSelectionChanged() && videoSelectionChanged()) {
      $scope.processing = true;
      return StorageFactory.uploadFile($scope.audio.file)
        .then(function(res) {
          $scope.postData.awsAudioKeyName = res.Key;
          return StorageFactory.uploadFile($scope.video.file);
        })
        .then(function(res) {
          $scope.postData.awsVideoKeyName = res.Key;
          return StorageFactory.uploadFile($scope.image.file);
        })
        .then(function(res) {
          $scope.postData.awsImageKeyName = res.Key;
          return StorageFactory.updatePost($scope.postData);
          $state.go('releaser');
        })
        .then(function(post) {
          $state.reload();
        })
        .catch(function(error) {
          $.Zebra_Dialog(error, {
            width: 600
          });
        });
    }
    // only audio is being changed
    else if (audioSelectionChanged()) {
      $scope.processing = true;
      return StorageFactory.uploadFile($scope.audio.file)
        .then(function(res) {
          $scope.postData.awsAudioKeyName = res.Key;
          return StorageFactory.updatePost($scope.postData);
          $.Zebra_Dialog('Updated Successfully');
          $state.go('releaser');
        })
        .then(function() {
          $scope.processing = false;
          $state.reload();
        })
        .catch(function(error) {
          $.Zebra_Dialog(error, {
            width: 600
          });
        });
    }
    // only video is being changed
    else if (videoSelectionChanged()) {
      $scope.processing = true;
      return StorageFactory.uploadFile($scope.video.file)
        .then(function(res) {
          $scope.postData.awsVideoKeyName = res.Key;
          return StorageFactory.updatePost($scope.postData);
          $state.go('releaser');
        })
        .then(function() {
          $scope.processing = false;
          $state.reload();
        })
        .catch(function(error) {
          $.Zebra_Dialog(error, {
            width: 600
          });
        });
    }
    // neither audio nor video is changing
    else {
      // var errMsg = validateForm();
      // if(errMsg == ""){
      return StorageFactory.updatePost($scope.postData)
        .then(function(post) {
          $state.go('releaser');
        })
        .catch(function(error) {
          $.Zebra_Dialog(error, {
            width: 600
          });
        });

    }
  };

  var addPost = function() {
    var errMsg = validateForm();
    if (errMsg == "") {
      $scope.processing = true;
      $scope.postData.userID = $scope.user._id;
      StorageFactory.uploadFile($scope.audio.file)
        .then(function(res) {
          $scope.postData.awsAudioKeyName = res.key;
          return StorageFactory.uploadFile($scope.video.file);
        })
        .then(function(res) {
          $scope.postData.awsVideoKeyName = res.key;
          return StorageFactory.uploadFile($scope.image.file);
        })
        .then(function(res) {
          $scope.postData.awsImageKeyName = res.key;
          return StorageFactory.addPost($scope.postData);
        })
        .then(function() {
          $scope.processing = false;
          $state.go('releaser');
        })
        .catch(function(error) {
          $scope.processing = false;
          $.Zebra_Dialog(error, {
            width: 600
          });
        });
    } else {
      $.Zebra_Dialog(errMsg, {
        width: 600
      });
    }
  };

  var validateForm = function() {
    var isSCPanelOpen = $("#pnlSoundCloud").hasClass("in");
    var isFBPanelOpen = $("#pnlFacebook").hasClass("in");
    var isTWPanelOpen = $("#pnlTwitter").hasClass("in");
    var isYTPanelOpen = $("#pnlYoutube").hasClass("in");
    var message = "";
    if ($scope.postData.postTitle == undefined) {
      message += "Post title is required. <br />";
    }
    if ($scope.postData.postDate == undefined) {
      message += "Post date is required. <br />";
    }
    if (!isSCPanelOpen && !isFBPanelOpen && !isTWPanelOpen && !isYTPanelOpen) {
      message += "Please enter atleast one of the social site posting information. <br />";
    } else {
      if (isSCPanelOpen) {
        if (($scope.postData.awsAudioKeyName == undefined && $scope.audio.file == undefined) || $scope.postData.soundCloudTitle == undefined || $scope.postData.soundCloudDescription == undefined) {
          message += "All Soundcloud posting informations are required. <br />";
        }
      }
      if (isFBPanelOpen) {
        if ($scope.postData.facebookPost == undefined || ($scope.facebookCommentOn == "page" && $scope.postData.facebookPageUrl == undefined)) {
          message += "All Facebook posting informations are required. <br />";
        }
      }
      if (isTWPanelOpen) {
        if ($scope.postData.twitterPost == undefined) {
          message += "All Twitter posting informations are required. <br />";
        }
      }
      if (isYTPanelOpen) {
        if (($scope.postData.awsVideoKeyName == undefined && $scope.video.file == undefined) || $scope.postData.youTubeTitle == undefined || $scope.postData.youTubeDescription == undefined) {
          message += "All Youtube posting informations are required. <br />";
        }
      }
    }
    return message;
  }

  $scope.deletePost = function(index) {
    var postId = $scope.posts[index]._id;
    StorageFactory.deletePost(postId)
      .then(function() {
        $state.reload();
      })
      .catch(function(error) {
        $.Zebra_Dialog(error, {
          width: 600
        });
      });
  };

  $scope.editPost = function(post) {
    $scope.postData = post;
    oldPostData = post;
  };

  $scope.getPost = function() {
    $scope.posts = [];
    StorageFactory.fetchAll().then(function(res) {
      $scope.posts = res;
    })
  }

  /* Method for getting post in case of edit */
  $scope.getPostInfo = function(releaseID) {
    $scope.pagecomment = false;
    StorageFactory
      .getPostForEdit({
        id: releaseID
      })
      .then(handleResponse)
      .catch(handleError);

    function handleResponse(res) {
      $scope.postData = res;
      oldPostData = res;
      if ($scope.postData.facebookPageUrl) {
        $scope.pagecomment = true;
        $scope.facebookCommentOn = "page";
      } else {
        $scope.facebookCommentOn = "user";
      }
    }

    function handleError(res) {

    }
    $scope.processing = false;
  };
  $scope.checkIfEdit = function() {
    if ($stateParams.releaseID) {
      $scope.getPostInfo($stateParams.releaseID);
    }
  };
  $scope.broadcastPost = function(post) {
    var isValid = true;
    var message = "It seems you did not authenticate to the social sites before releasing the post. We did not found followin missing tokens - <br />";
    if (post.facebookPost != "" && !$scope.user.facebook && !$scope.user.facebook.token) {
      isValid = false;
      message += "Facebook token is missing. <br />";
    }

    if (post.twitterPost != "" && !$scope.user.twitter && !$scope.user.twitter.token) {
      isValid = false;
      message += "Twitter token is missing. <br />";
    }

    if (post.awsVideoKeyName != "" && !$scope.user.google && !$scope.user.google.token) {
      isValid = false;
      message += "Google token is missing. <br />";
    }
    message += "Please use the links to below Add New Post button to get the social site auth tokens.";

    if (isValid) {
      $scope.processing = true;
      BroadcastFactory[post.facebookPageUrl ? 'submitFacebookPagePost' : 'submitFacebookUserPost'](post._id, {
          token: $scope.user.facebook.token,
          facebookPost: post.facebookPost,
          facebookPageUrl: post.facebookPageUrl,
          facebookPageInfo: post.facebookPageInfo
        })
        .then(function(res) {
          if ($scope.user.twitter.token) {
            BroadcastFactory.submitTwitterPost(post._id, {
              token: $scope.user.twitter.token,
              tokenSecret: $scope.user.twitter.tokenSecret,
              twitterPost: post.twitterPost
            });
          }
          return false;
        })
        .then(function(res) {
          if ($scope.user.google.token) {
            return BroadcastFactory.submitYouTubePost(post._id, {
              token: $scope.user.google.token,
              awsVideoKeyName: post.awsVideoKeyName
            });
          }
          return false;
        })
        .then(function(res) {
          return BroadcastFactory.submitSoundCloudPost(post._id, {
            awsAudioKeyName: post.awsAudioKeyName
          })
        })
        .then(function(res) {
          if (post.awsAudioKeyName) {
            SC.initialize({
              client_id: '8002f0f8326d869668523d8e45a53b90',
              oauth_token: $scope.user.soundcloud.token
            });

            var trackFile = new File(res.data.Body.data, post.awsAudioKeyName, {
              type: 'audio/mp3'
            });
            SC.upload({
                file: trackFile,
                title: post.soundCloudTitle,
                description: post.soundCloudDescription
              })
              .then(function(res) {
                StorageFactory.updateReleaseStatus(post)
                  .then(function(res) {
                    $scope.getPost();
                    $scope.processing = false;
                  });
              })
              .catch(function(error) {
                $scope.processing = false;
                console.log('error', error);
              });
          }
          return false;
        }).
      then(function(res) {
        if (post.awsImageKeyName) {
          return BroadcastFactory.submitInstagramPost(post._id, {
            token: $scope.user.instagram.token,
            instagramPost: post.instagramPost
          });
        } else {
          StorageFactory.updateReleaseStatus(post)
            .then(function(res) {
              $scope.getPost();
              $scope.processing = false;
            });
        }
      });
    } else {
      $.Zebra_Dialog(message, {
        width: 600
      });
    }
  }; // CLOSES $scope.broadcastPost

  $scope.socialLogin = function(url) {
    $window.location = url;
  };

  $scope.checkFBToken = function() {
    if ($scope.user.facebook && $scope.user.facebook.token != "") {
      StorageFactory.validateToken($scope.user._id, 'facebook').then(function(res) {
        if (res) {
          SessionService.create(res.data);
          $scope.user = SessionService.getUser();
        }
      });
    }
  }

  $scope.checkGoogleToken = function() {
    if ($scope.user.google && $scope.user.google.token != "") {
      StorageFactory.validateToken($scope.user._id, 'google').then(function(res) {
        if (res) {
          SessionService.create(res.data);
          $scope.user = SessionService.getUser();
        }
      });
    }
  }


  $scope.getUserNetwork();
  //$scope.checkFBToken();
  //$scope.checkGoogleToken();
}); // CLOSES app.controller