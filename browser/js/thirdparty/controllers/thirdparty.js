app.config(function($stateProvider) {
  $stateProvider.state('thirdparty', {
    url: '/admin/thirdparty',
    templateUrl: 'js/thirdparty/views/thirdparty.html',
    controller: 'thirdpartyController'
  })
});

app.controller('thirdpartyController', function($rootScope, $state, $scope, $http, AuthService, SessionService, thirdpartyservice, $sce, $window) {
  $scope.isLoggedIn = SessionService.getUser() ? true : false;
  if (!SessionService.getUser()) {
    $state.go('admin');
  }
  SessionService.removeAccountusers(); 
  $scope.accountuser = SessionService.getUser();
  $scope.accountuser.paidRepost.groups = $scope.accountuser.paidRepost.groups ? $scope.accountuser.paidRepost.groups : [];

  //add account prepare part

  $scope.addGroup = function(index, item) {
    $scope.accountuser.paidRepost[index].groups.push('');
  }
  
  $scope.updateGroup = function(account) {
    var priceFlag = true;
    for (var i = $scope.accountuser.paidRepost.length - 1; i >= 0; i--) {
      if ($scope.accountuser.paidRepost[i].price) {
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
      paidRepost: $scope.accountuser.paidRepost,
    }).then(function(res) {
      $scope.processing = false;
      SessionService.create(res.data);
      $scope.accountuser = SessionService.getUser();
    });
  }


  $scope.updatePaidRepostGroup = function(item, group) {
    console.log($scope.accountuser.paidRepost.length + " length");
    for (var i = 0; i < $scope.accountuser.paidRepost.length; i++) {
      console.log("length");
      if ($scope.accountuser.paidRepost[i].id == item.id) {
        $scope.accountuser.paidRepost[i].groups.push(group);
      }
    }
  }

  
  $scope.getPaidRepostAccounts = function() {
    $http.get('/api/thirdpartyuser/getPaidRepostAccounts').then(function(res) {
      
      res.data = res.data.sort(function(a, b) {
        return a.user.id - b.user.id;
      });
      $scope.accountuser.paidRepost = res.data;      
    });
  }

  $scope.getPaidRepostAccounts();
  console.log($scope.accountuser + "  rascal before");
  
  //create account_domodal 
  $scope.Adduser_domodal = function() {
    $scope.showTestEmailModal = true;
    $('#AddUser').modal('show');
  }

  var refresh = function(){
    $http.get('/api/thirdpartyuser').then(function(response){
      $scope.Userlist = response.data;
      console.log(response.data);
    });
  }
  refresh();

  //Create user part
  $scope.Createuser = function(email, password) {
    if (email=="" || password=="") {
      alert("correct input");
    };
    var accountemail = $scope.accountuser.email;
    console.log(accountemail + "accountemail rascal");
		$http.post('/api/thirdpartyuser', {
        accountemail: accountemail,
        email: email,
        password: password
      }).then(function(res) {
      console.log("rascal res");
      //console.log(les);
    });    
    refresh();
  }

 //add user close
  $scope.closeModal = function() {
    $('#AddUser').modal('hide');
  }


  //adduser  
  $scope.adduser = function(id) {
    //i++;
    $http.get('/api/thirdpartyuser/adduser/' + id)
    .then(function(response) {
      $scope.adduser = response.data;
      $scope.getPaidRepostAccounts();
    });
    
  }

  //delete user 
  $scope.deleteuser = function() {
    var email= $scope.adduser.email;
    console.log(email + "rascal email");
    $http.delete('/api/thirdpartyuser/' + email)
    .then(function(response){
      console.log("delete rascal");
      $scope.adduser=response.data;
      console.log(response + "rascal delete success");
        refresh();
      });
  }
  //complete----------------------------------------
  $scope.addaccount = [];
  $scope.accountid = [];
  //save  
  $scope.save = function() {
    console.log($scope.addaccount[1]);
    console.log($scope.adduser.email);
    /*$http.post('/api/thirdpartyuser/addaccount', {
        useremail: $scope.adduser.email,
        registeraccount:  $scope.addaccount,
      }).then(function(res) {
      console.log("rascal res");
    });*/
    
    for (var i = $scope.addaccount.length - 1; i >= 0; i--) {
      var accountobject=JSON.parse($scope.addaccount[i]);
      console.log(accountobject.userID);
      console.log($scope.addaccount[i]+ "rascal create user");
      $http.post('/api/thirdpartyuser/addaccount', {
        useremail: $scope.adduser.email,
        userID: accountobject.userID,
        premierUrl: accountobject.premierUrl,
        submissionUrl: accountobject.submissionUrl,
        description: accountobject.description,
        price : accountobject.price,
        createdOn : accountobject.createdOn,
        linkInBio : accountobject.linkInBio
      }).then(function(res) {
      console.log("rascal res");
      });       
    };
    /*$http.post('/api/thirdpartyuser/addaccount', {
        //name: name,
        useremail: $scope.adduser.email,
        registeraccount:  $scope.addaccount
      }).then(function(res) {
      console.log("rascal res");
      //console.log(les);
    });  */  
    
  }
 
  

});
