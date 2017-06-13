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
      if ($scope.accountuser.paidRepost[i].id == item.id) {
        $scope.accountuser.paidRepost[i].groups.push(group);
      }
    }
  }

  //getting scheduler access account
  $scope.getPaidRepostAccounts = function() {
    $http.get('/api/thirdpartyuser/getPaidRepostAccounts').then(function(res) {
      res.data = res.data.sort(function(a, b) {
        return a.user.id - b.user.id;
      });
      $scope.accountuser.paidRepost = res.data;      
    });
  }

  $scope.getPaidRepostAccounts();
  
  //create account_domodal 
  $scope.Adduser_domodal = function() {
    $scope.showTestEmailModal = true;
    $('#AddUser').modal('show');
  }

  var refresh = function(){
    //getting added subadmin account
    $http.get('/api/thirdpartyuser').then(function(response){
      $scope.Userlist = response.data;
      console.log(response.data);
    });
    
  }
  refresh();

  //getting submission account 
  $scope.submissionaccountlisteven = [];
  $scope.submissionaccountlistadd = [];
  $http.get('/api/thirdpartyuser/getsubmissionAccounts').then(function(res) {
    var evenindex=0;
    var addindex = 0;
    for (var i = 0; i < res.data.length; i++) {
      if ((i%2)== 0) {
        $scope.submissionaccountlisteven[evenindex]=res.data[i];
        evenindex ++;
      } else{
        $scope.submissionaccountlistadd[addindex]=res.data[i];
        addindex ++;
      };
    };
  });

  //Create subadminaccount part
  $scope.Createuser = function(email, password) {
    if (email=="" || password=="") {
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


  //add selected user part  
  $scope.adduser = function(id) {
    //i++;
    $http.get('/api/thirdpartyuser/adduser/' + id)
    .then(function(response) {
      $scope.adduser = response.data;
    });
    
  }

  //delete selected user part 
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
 
  //save subadmin account part 
  $scope.addaccount = [];
  $scope.addsubmissionusereven = [];
  $scope.addsubmissionuser = []; 
 
  $scope.save = function() {
    var subaccountlength = 0;
    var scheduleraccountlength = 0;
    var scheduleraccount = [];
    var submissionaccountlist = [];
    var submissionaccount = [];
    var subname = [];
    var subemail = [];
    console.log($scope.addaccount.length + " $scope.addaccount.length");
    for (var i = $scope.addaccount.length; i > 0; i--) {
      if ($scope.addaccount[i]) {
        console.log(i + " i");
        scheduleraccount[scheduleraccountlength]=JSON.parse($scope.addaccount[i]);
        scheduleraccountlength++;
      };     
    };

    for (var j = 0; j < $scope.addsubmissionusereven.length; j++) {
      if ($scope.addsubmissionusereven[j]) {
        console.log(j + " j");
        submissionaccountlist[subaccountlength]=JSON.parse($scope.addsubmissionusereven[j]);
        subname[subaccountlength] = submissionaccountlist[subaccountlength].name;
        subemail[subaccountlength] = submissionaccountlist[subaccountlength].email;
        subaccountlength++;
      };
    };
    
    console.log(subaccountlength + " subaccountlength");
    for (var l = 0; l < $scope.addsubmissionuser.length;  l++ ) {
      if ($scope.addsubmissionuser[l]) {
        submissionaccountlist[subaccountlength]=JSON.parse($scope.addsubmissionuser[l]);
        subname[subaccountlength] = submissionaccountlist[subaccountlength].name;
        subemail[subaccountlength] = submissionaccountlist[subaccountlength].email;
        subaccountlength++;
      };
    };
    submissionaccount[0] = subname;
    submissionaccount[1] = subemail;
    $http.post('/api/thirdpartyuser/saveaccount', {
        useremail: $scope.adduser.email,
        scheduleraccount : scheduleraccount,
        submissionaccount : submissionaccount
      }).then(function(res) {
      console.log("rascal res");
      });
  }
 
  

});
