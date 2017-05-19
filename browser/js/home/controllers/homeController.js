app.config(function($stateProvider) {
  $stateProvider
    .state('home', {
      url: '/',
      templateUrl: 'js/home/views/home.html',
      controller: 'HomeController'
    })
    .state('about', {
      url: '/about',
      templateUrl: 'js/home/views/about.html',
      controller: 'HomeController'
    })
    .state('services', {
      url: '/services',
      templateUrl: 'js/home/views/services.html',
      controller: 'HomeController'
    })
    .state('faqs', {
      url: '/faqs',
      templateUrl: 'js/home/views/faqs.html',
      controller: 'HomeController'
    })
    .state('apply', {
      url: '/apply',
      templateUrl: 'js/home/views/apply.html',
      controller: 'HomeController'
    })
    .state('contact', {
      url: '/contact',
      templateUrl: 'js/home/views/contact.html',
      controller: 'HomeController'
    });
});

app.controller('HomeController', ['$rootScope',
  '$state',
  '$scope',
  '$http',
  '$location',
  '$window',
  'HomeService',
  function($rootScope, $state, $scope, $http, $location, $window, HomeService) {

    $scope.applicationObj = {};
    $scope.artist = {};
    $scope.sent = {
      application: false,
      artistEmail: false
    };
    $scope.message = {
      application: {
        val: '',
        visible: false
      },
      artistEmail: {
        val: '',
        visible: false
      }
    };

    /* Apply page start */

    $scope.toggleApplicationSent = function() {
      $scope.message = {
        application: {
          val: '',
          visible: false
        }
      };
      $scope.sent.application = !$scope.sent.application;
    };

    $scope.saveApplication = function() {

      $scope.message.application = {
        val: '',
        visible: false
      };

      HomeService
        .saveApplication($scope.applicationObj)
        .then(saveApplicationResponse)
        .catch(saveApplicationError)

      function saveApplicationResponse(res) {
        if (res.status === 200) {
          $scope.applicationObj = {};
          $scope.sent.application = true;
        }
      }

      function saveApplicationError(res) {
        if (res.status === 400) {
          $scope.message.application = {
            val: 'Email already exists!',
            visible: true
          };
          return;
        }
        $scope.message.application = {
          val: 'Error in processing your request',
          visible: true
        };
      }
    };

    /* Apply page end */

    /* Artist Tools page start */

    $scope.toggleArtistEmail = function() {
      $scope.message = {
        artistEmail: {
          val: '',
          visible: false
        }
      };
      $scope.sent.artistEmail = !$scope.sent.artistEmail;
    };

    $scope.saveArtistEmail = function() {
      HomeService
        .saveArtistEmail($scope.artist)
        .then(artistEmailResponse)
        .catch(artistEmailError)

      function artistEmailResponse(res) {
        if (res.status === 200) {
          $scope.artist = {};
          $scope.sent.artistEmail = true;
        }
      }

      function artistEmailError(res) {
        if (res.status === 400) {
          $scope.message.artistEmail = {
            val: 'Email already exists!',
            visible: true
          };
          return;
        }

        $scope.message.artistEmail = {
          val: 'Error in processing your request',
          visible: true
        };
      }
    };

    /* Artist Tools page end */
  }
]);

app.directive('affixer', function($window) {
  return {
    restrict: 'EA',
    link: function($scope, $element) {
      var win = angular.element($window);
      var topOffset = $element[0].offsetTop;

      function affixElement() {

        if ($window.pageYOffset > topOffset) {
          $element.css('position', 'fixed');
          $element.css('top', '3.5%');
        } else {
          $element.css('position', '');
          $element.css('top', '');
        }
      }

      $scope.$on('$routeChangeStart', function() {
        win.unbind('scroll', affixElement);
      });
      win.bind('scroll', affixElement);
    }
  };
})