app.config(function($stateProvider) {
  $stateProvider.state('autoEmailsList', {
    url: '/admin/database/autoEmails',
    templateUrl: 'js/database/autoEmails/autoEmailsList.html',
    controller: 'AutoEmailsListController',
    resolve: {
      templates: function($http) {
        return $http.get('/api/database/autoEmails')
          .then(function(res) {
            var template = res.data;
            if (template) {
              return template;
            } else {
              return {
                purpose: "Biweekly Email"
              }
            }
          })
          .then(null, function(err) {
            $.Zebra_Dialog("ERROR: Something went wrong.");
          })
      }
    }
  });
});

app.controller('AutoEmailsListController', function($rootScope, $state, $scope, $http, AuthService, templates) {
  $scope.loggedIn = false;
  $scope.templates = templates;

  // $scope.getTemplate = function() {
  //   $scope.processing = true;
  //   $http.get('/api/database/autoEmails/biweekly?isArtist=' + String($scope.template.isArtist))
  //     .then(function(res) {
  //       var template = res.data;
  //       $scope.processing = false;
  //       if (template) {
  //         $scope.template = template;
  //       } else {
  //         $scope.template = {
  //           purpose: "Biweekly Email",
  //           isArtist: false
  //         };
  //       }
  //     })
  //     .then(null, function(err) {
  //       $.Zebra_Dialog("ERROR: Something went wrong.");
  //     });
  // };

  // console.log(template);
  $scope.save = function() {
    $scope.processing = true;
    $http.post('/api/database/autoEmails', $scope.template)
      .then(function(res) {
        $.Zebra_Dialog("Saved email.");
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

})