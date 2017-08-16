app.config(function($stateProvider) {
  $stateProvider.state('accounts', {
    url: '/admin/accounts',
    templateUrl: 'js/accounts/views/accounts.html',
    controller: 'accountsController'
  })
});

app.controller('accountsController', function($rootScope, $state, $scope, $http, AuthService, SessionService, $sce, accountService) {
  $scope.isLoggedIn = SessionService.getUser() ? true : false;
  if (!SessionService.getUser()) {
    $state.go('admin');
  }
  SessionService.removeAccountusers();
  $scope.user = SessionService.getUser();
  $scope.user.paidRepost.groups = $scope.user.paidRepost.groups ? $scope.user.paidRepost.groups : [];
  $scope.soundcloudLogin = function() {
    $scope.processing = true;
    SC.connect()
      .then(function(res) {
        $rootScope.accessToken = res.oauth_token;
        return $http.post('/api/login/soundCloudAuthentication', {
          token: res.oauth_token,
          password: 'test'
        });
      })
      .then(function(res) {
        var scInfo = res.data.user.soundcloud;
        scInfo.groups = [];
        scInfo.description = "";
        scInfo.price = 1;
        $http.post('/api/database/updateUserAccount', {
          soundcloudInfo: scInfo,
        }).then(function(user) {
          $scope.processing = false;
          location.reload();
        });
      })
      .then(null, function(err) {
        console.log(4)
        console.log(err);
        $.Zebra_Dialog('Error: Could not log in');
        $scope.processing = false;
      });
  };

  $scope.addAccounts = function(actions, index) {
    SessionService.addActionsfoAccount(actions, index);
    $state.go("channelstep1");
  }

  $scope.deletePaidRepost = function(index) {
    $.Zebra_Dialog('Do you really want to delete this account?', {
      'buttons': [{
        caption: 'Yes',
        callback: function() {
          var postRepost = $scope.user.paidRepost[index].userID;
          accountService.deleteUserAccount(postRepost)
            .then(function(res) {
              $scope.user.paidRepost.splice(index, 1);
            })
        }
      }, {
        caption: 'No',
        callback: function() {}
      }]
    });
  };

  $scope.updateGroup = function(account) {
    var priceFlag = true;
    for (var i = $scope.user.paidRepost.length - 1; i >= 0; i--) {
      if ($scope.user.paidRepost[i].price) {
        priceFlag = true;
      } else {
        priceFlag = false;
        break;
      }
    }
    if (!priceFlag) {
      return $.Zebra_Dialog('Price can not be empty.');
    }
    $scope.processing = true;
    $http.post('/api/database/updateGroup', {
      paidRepost: $scope.user.paidRepost,
    }).then(function(res) {
      $scope.processing = false;
      SessionService.create(res.data);
      $scope.user = SessionService.getUser();
    });
  }

  $scope.addItems = function(rowid, index) {
    $("#" + rowid).toggleClass();
  }

  $scope.addGroup = function(index, item) {
    $scope.user.paidRepost[index].groups.push('');
  }
  $scope.removeItem = function(parentIndex, index, item) {
    $scope.user.paidRepost[parentIndex].groups.splice(index, 1)
  }
  $scope.updatePaidRepostGroup = function(item, group) {
    for (var i = 0; i < $scope.user.paidRepost.length; i++) {
      if ($scope.user.paidRepost[i].id == item.id) {
        $scope.user.paidRepost[i].groups.push(group);
      }
    }
  }
  $scope.clicked = false;
  $scope.whiteSlot = [1, 2, 3, 5, 6, 7, 9, 10, 11, 13, 14, 15, 17, 18, 19, 21, 22, 23];
  $scope.clickedSlot = function(index) {
    $scope.clicked = true;
    if ($scope.whiteSlot.indexOf(index) > -1) {
      var value = $scope.whiteSlot.indexOf(index);
      $scope.whiteSlot.splice(value, 1)
    } else {
      $scope.whiteSlot.push(index);
    }
  }

  $scope.getPaidRepostAccounts = function() {
    $http.get('/api/submissions/getPaidRepostAccounts').then(function(res) {
      res.data = res.data.sort(function(a, b) {
        return a.user.id - b.user.id;
      });
      $scope.user.paidRepost = res.data;
    });
  }

  $scope.editprice = function(index, userdata) {
    if (userdata.price < 6 || userdata.price == undefined) {
      userdata.price = 6;
      $.Zebra_Dialog('Please enter a price (minimum $6).');
      return;
    }
    $scope.processing = true;
    $scope.user.paidRepost[index].price = userdata.price;
    $http.post('/api/database/updateGroup', {
      paidRepost: $scope.user.paidRepost,
    }).then(function(res) {
      $scope.processing = false;
      SessionService.create(res.data);
      $scope.user = SessionService.getUser();
      $scope.getPaidRepostAccounts();
    });
  }

  $scope.getPaidRepostAccounts();
});
