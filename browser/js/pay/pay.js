app.config(function($stateProvider) {
  $stateProvider.state('pay', {
    url: '/pay/:submissionID',
    templateUrl: 'js/pay/pay.html',
    controller: 'PayController',
    resolve: {
      submission: function($http, $stateParams) {
        return $http.get('/api/submissions/withID/' + $stateParams.submissionID)
          .then(function(res) {
            return res.data;
          })
      },
      channels: function($http, submission) {
        submission.channels.sort(function() {
          return .5 - Math.random();
        });
        return submission.channels;
      }
    }
  });
});

app.filter('calculateDiscount', function() {
  return function(input) {
    return parseFloat(input * 0.90).toFixed(2);
  };
});

app.controller('PayController', function($scope, $rootScope, $http, channels, submission, $state, $uibModal, AppConfig) {
  $rootScope.submission = submission;
  $scope.auDLLink = false;
  $scope.showSignUp = false;
  if ($state.$current.name == "pay") {
    $scope.showSignUp = true;
  }

  $scope.total = 0;
  $scope.showTotal = 0;
  $scope.channels = channels;

  $scope.goToLogin = function() {
    $state.go('login', {
      'submission': $rootScope.submission
    });
  }

  $scope.makePayment = function() {
    if ($scope.total != 0) {
      if ($scope.auDLLink) {
        $scope.discountModalInstance = $uibModal.open({
          animation: true,
          templateUrl: 'discountModal.html',
          controller: 'discountModalController',
          scope: $scope
        });
      } else {
        $scope.continuePay(false);
      }
    } else {
      $.Zebra_Dialog('Please add a repost to your cart by clicking "Add To Cart".');
    }
  };

  $scope.continuePay = function(discounted) {
    if ($scope.discountedModal) {
      $scope.discountModalInstance.close();
    }
    $scope.processing = true;
    if (discounted) $scope.showTotal = parseFloat($scope.total * 0.9).toFixed(2);
    else $scope.showTotal = parseFloat($scope.total).toFixed(2);
    var pricingObj = {
      total: $scope.showTotal,
      submission: $rootScope.submission,
      channels: $scope.channels.filter(function(ch) {
        return ch.addtocart;
      })
    };
    $http.post('/api/submissions/getPayment', pricingObj)
      .then(function(res) {
        window.location = res.data;
      }).then(null, function(err) {
        $scope.processing = false;
        $.Zebra_Dialog(err.message);
      })
  }

  $scope.addToCart = function(channel) {
    if (channel.addtocart) {
      $scope.total = $scope.total - parseFloat(channel.price);
    } else {
      $scope.total += parseFloat(channel.price);
    }
    channel.addtocart = channel.addtocart ? false : true;
    if ($scope.auDLLink) $scope.showTotal = parseFloat($scope.total * 0.9).toFixed(2);
    else $scope.showTotal = parseFloat($scope.total).toFixed(2);
  };
  $scope.getTrack = function() {

    SC.get('/tracks/' + submission.trackID)
      .then(function(track) {
        $scope.track = track;
      });
    setTimeout(function() {
      //$scope.auDLLink = $scope.track.purchase_url ? true: false;
      SC.Widget('scPlayer').load(submission.trackURL, {
        auto_play: false,
        show_artwork: true
      });
      // SC.oEmbed(submission.trackURL, {
      //     element: document.getElementById('scPlayer'),
      //     auto_play: false,
      //     maxheight: 150
      //   });
    }, 3000);
  }
  $scope.getTrack();
});


app.controller('discountModalController', function($scope) {

})
