app.config(function($stateProvider) {
  $stateProvider.state('autoEmailsNew', {
    url: '/admin/database/autoEmails/new',
    templateUrl: 'js/database/autoEmails/autoEmails.html',
    controller: 'AutoEmailsController'
  });
});

app.config(function($stateProvider) {
  $stateProvider.state('autoEmailsEdit', {
    url: '/admin/database/autoEmails/edit/:templateId',
    templateUrl: 'js/database/autoEmails/autoEmails.html',
    controller: 'AutoEmailsController',
    // resolve: {
    //   template: function($http) {
    //     return $http.get('/api/database/autoEmails/biweekly?isArtist=true')
    //       .then(function(res) {
    //         var template = res.data;
    //         if (template) {
    //           return template;
    //         } else {
    //           return {
    //             purpose: "Biweekly Email"
    //           }
    //         }
    //       })
    //       .then(null, function(err) {
    //         $.Zebra_Dialog("ERROR: Something went wrong.");
    //       })
    //   }
    // }
  });
});

app.controller('AutoEmailsController', function($rootScope, $state, $scope, $http, $stateParams, AuthService) {
  $scope.loggedIn = false;


  $scope.isStateParams = false;
  if ($stateParams.templateId) {
    $scope.isStateParams = true;
  }
  // $scope.template = template;

  $scope.template = {
    isArtist: false
  };

  $scope.getTemplate = function() {
    if ($stateParams.templateId) {
      $scope.processing = true;
      $http.get('/api/database/autoEmails?templateId=' + $stateParams.templateId)
        .then(function(res) {
          var template = res.data;
          $scope.processing = false;
          if (template) {
            $scope.template = template;
          } else {
            $scope.template = {};
          }
        })
        .then(null, function(err) {
          $.Zebra_Dialog("ERROR: Something went wrong.");
        });
    } else {
      return false;
    }
  };

  // console.log(template);
  $scope.save = function() {
    $scope.processing = true;
    $http.post('/api/database/autoEmails/', $scope.template)
      .then(function(res) {
        $.Zebra_Dialog("Saved email template.")
        $scope.processing = false;
      })
      .then(null, function(err) {
        $.Zebra_Dialog("ERROR: Message could not save.")
        $scope.processing = false;
      });
  }

  // $scope.login = function() {
  //   $scope.processing = true;
  //   $http.post('/api/login', {
  //     password: $scope.password
  //   }).then(function() {
  //     $rootScope.password = $scope.password;
  //     $scope.loggedIn = true;
  //     $scope.processing = false;
  //   }).catch(function(err) {
  //     $scope.processing = false;
  //     $.Zebra_Dialog('Wrong Password');
  //   });
  // }

  $scope.logout = function() {
    $http.get('/api/logout').then(function() {
      window.location.href = '/admin';
    }).catch(function(err) {
      $scope.processing = false;
      $.Zebra_Dialog('Wrong Password');
    });
  }

});