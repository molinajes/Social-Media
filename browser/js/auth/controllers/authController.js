app.config(function($stateProvider) {
  $stateProvider
    .state('login', {
      url: '/login',
      params: {
        submission: null
      },
      templateUrl: 'js/auth/views/login.html',
      controller: 'AuthController',
      resolve: {
        config: function(AppConfig) {
          return AppConfig.fetchConfig().then(function(res) {
            return AppConfig.setConfig(res.data);
          })
        }
      }
    })
    .state('signup', {
      url: '/signup',
      templateUrl: 'js/auth/views/signup.html',
      controller: 'AuthController'
    });
});

app.controller('AuthController', function($rootScope, $state, $stateParams, $scope, $http, $uibModal, $window, AuthService, SessionService, socket) {
  $scope.loginObj = {};
  $scope.message = {
    val: '',
    visible: false
  };

  if ($window.localStorage.getItem('returnstate') == 'reForReInteraction') {
    $.Zebra_Dialog("Please log in with the account who's trade you wish to view.", {
      'type': 'question',
      'buttons': [{
        caption: 'Cancel',
        callback: function() {
          $window.localStorage.removeItem('returnstate');
          $window.localStorage.removeItem('user1Name');
          $window.localStorage.removeItem('user2Name');
        }
      }, {
        caption: 'Log In',
        callback: function() {
          $scope.soundcloudLogin();
        }
      }]
    });
  }

  if (SessionService.getUser()) {
    $state.go('reForReLists')
  }
  $scope.openModal = {
    signupConfirm: function() {
      $scope.modalInstance = $uibModal.open({
        animation: true,
        templateUrl: 'signupComplete.html',
        controller: 'AuthController',
        scope: $scope
      });
    }
  };

  $scope.login = function() {
    $scope.message = {
      val: '',
      visible: false
    };
    AuthService
      .login($scope.loginObj)
      .then(handleLoginResponse)
      .catch(handleLoginError)

    function handleLoginResponse(res) {
      if (res.status === 200 && res.data.success) {
        var userData = res.data.user;
        userData.isAdmin = false;
        SessionService.create(userData);
        $state.go('reForReLists');
      } else {
        $scope.message = {
          val: res.data.message,
          visible: true
        };
      }
    }

    function handleLoginError(res) {
      $scope.message = {
        val: 'Error in processing your request',
        visible: true
      };

    }
  };

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
          window.location.reload();
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

  $scope.closeModal = function() {
    $('#emailModal').modal('hide');
  }

  $scope.promptForEmail = function() {
    console.log('prompting');
    $scope.showEmailModal = true;
    $('#emailModal').modal('show');
    if (!$scope.$$phase) $scope.$apply();
  }

  $scope.thirdPartyLogin = function(userdata) {
    AuthService
      .thirdPartylogin(userdata)
      .then(handleLoginResponse)
      .catch(handleLoginError)

    function handleLoginResponse(res) {
       SessionService.create(res.data.user);
        $state.go('reForReLists');
     
    }

    function handleLoginError(res) {
      $.Zebra_Dialog("Error in processing your request");
    }
  }

  $scope.checkIfSubmission = function() {
    if ($stateParams.submission) {
      $scope.soundcloudLogin();
    }
  }
  $scope.signup = function() {
    $scope.message = {
      val: '',
      visible: false
    };
    if ($scope.signupObj.password != $scope.signupObj.confirmPassword) {
      $scope.message = {
        val: 'Password doesn\'t match with confirm password',
        visible: true
      };
      return;
    }
    AuthService
      .signup($scope.signupObj)
      .then(handleSignupResponse)
      .catch(handleSignupError)

    function handleSignupResponse(res) {
      $state.go('login');
    }

    function handleSignupError(res) {}
  };

  $scope.soundcloudLogin = function() {
    $scope.processing = true;
    SC.connect()
      .then(function(res) {
        $rootScope.accessToken = res.oauth_token;
        return $http.post('/api/login/soundCloudLogin', {
          token: res.oauth_token,
          password: 'test'
        });
      })
      .then(function(res) {
        $scope.processing = false;
        var userData = res.data.user;
        userData.isAdmin = false;
        SessionService.create(userData);
        $scope.user = SessionService.getUser();
        if (!$scope.user.email) {
          $scope.promptForEmail();
        } else {
          $scope.redirectLogin();
        }
      })
      .then(null, function(err) {
        console.log(err);
        $scope.processing = false;
        $scope.$apply();
        $.Zebra_Dialog('Error: Could not log in');
      });
  };

  $scope.redirectLogin = function() {
    if ($stateParams.submission) {
      $state.go('artistToolsDownloadGatewayNew', {
        'submission': $stateParams.submission
      });
      return;
    }
    $scope.processing = false;
    console.log($window.localStorage.getItem('returnstate'));
    if (!$scope.$$phase) $rootScope.$apply();
    if ($window.localStorage.getItem('returnstate') != undefined) {
      console.log('not undefined');
      if ($window.localStorage.getItem('returnstate') == "reForReInteraction") {
        console.log('/artistTools/trade/' + $window.localStorage.getItem('user1Name') + '/' + $window.localStorage.getItem('user2Name'))
        window.location.href = '/artistTools/trade/' + $window.localStorage.getItem('user1Name') + '/' + $window.localStorage.getItem('user2Name');
      } else if ($window.localStorage.getItem('returnstate') == "artistToolsDownloadGatewayEdit") {
        $state.go($window.localStorage.getItem('returnstate'), {
          gatewayID: $window.localStorage.getItem('tid')
        });
      } else {
        $state.go($window.localStorage.getItem('returnstate'));
      }
    } else {
      $state.go('artistToolsScheduler');
    }
  }
});
