app.config(function($stateProvider) {
  $stateProvider.state('thirdpartybasicstep1', {
    url: '/thirdparty/basic/step1',
    templateUrl: 'js/thirdpartyStep/views/basicstep1.html',
    controller: 'thirdpartyaccountSettingController'
  });

 });

app.controller('thirdpartyaccountSettingController', function($rootScope, $state, $scope, $http, $window, AccountSettingServices, SessionService) {

  $scope.defaultSubmitPage = {
    "button": {
      "text": "Submit",
      "style": {
        "fontColor": "rgba(0,0,0,1)",
        "bgColor": "rgba(255,255,255,1)",
        "fontSize": 15,
        "border": 1,
        "borderRadius": 10
      }
    },
    "inputFields": {
      "style": {
        "borderColor": "rgba(179,179,179,1)",
        "borderRadius": 10,
        "border": 1
      }
    },
    "subHeading": {
      "text": "Our mission is to connect musicians to their audiences. By submitting your track, you receive the opportunity to be reviewed by countless industry leading music promoters and independent labels. Although we can’t guarantee your track will be accepted, we can ensure that every submission will get heard and considered.",
      "style": {
        "fontFamily": "'Open Sans', sans-serif",
        "fontColor": "rgba(120,120,120,1)",
        "fontSize": 15
      }
    },
    "heading": {
      "text": "Submission",
      "style": {
        "fontSize": 32,
        "fontFamily": "'Open Sans', sans-serif",
        "fontColor": "rgba(120,120,120,1)"
      }
    },
    "logo": {
      "align": "center",
      "images": ""
    },
    "background": {
      "blur": 40,
      "images": ""
    },
    "layout": '4'
  }
  $scope.loadFontNames = function() {
    $scope.repHeadFont = $scope.AccountsStepData.postData.heading.style.fontFamily ? $scope.AccountsStepData.postData.heading.style.fontFamily.substring(1, $scope.AccountsStepData.postData.heading.style.fontFamily.indexOf("',")) : "";
    $scope.repSubheadFont = $scope.AccountsStepData.postData.subHeading.style.fontFamily ? $scope.AccountsStepData.postData.subHeading.style.fontFamily.substring(1, $scope.AccountsStepData.postData.subHeading.style.fontFamily.indexOf("',")) : "";
    $scope.premHeadFont = $scope.AccountsStepData.premier.heading.style.fontFamily ? $scope.AccountsStepData.premier.heading.style.fontFamily.substring(1, $scope.AccountsStepData.premier.heading.style.fontFamily.indexOf("',")) : "";
    $scope.premSubheadFont = $scope.AccountsStepData.premier.subHeading.style.fontFamily ? $scope.AccountsStepData.premier.subHeading.style.fontFamily.substring(1, $scope.AccountsStepData.premier.subHeading.style.fontFamily.indexOf("',")) : "";
  }

  $scope.isLoggedIn = SessionService.getUser() ? true : false;
  if (!$scope.isLoggedIn) {
    $state.go('admin');
  }
  $scope.user = SessionService.getUser();
  $scope.showTestEmailModal = false;
  $scope.errorverification = false;
  $scope.verified = false;
  $scope.waitoneminute = false;
  console.log('user', $scope.user);
  var formActions = SessionService.getActionsfoAccount() ? SessionService.getActionsfoAccount() : 0;
  if (!formActions && formActions != "Add" && formActions != "Edit") {
    $scope.user = SessionService.getUser();
    if ($scope.user && $scope.user.role == 'admin') {
      $rootScope.enableNavigation = $scope.user.paidRepost.length > 0 ? false : true;
    }
    $scope.showTestEmailModal = false;
    $scope.errorverification = false;
    $scope.verified = false;
    $scope.waitoneminute = false;
    //console.log('user',$scope.user);
    var formActions = SessionService.getActionsfoAccount() ? SessionService.getActionsfoAccount() : 0;
    if (!formActions && formActions != "Add" && formActions != "Edit") {
      $scope.user = SessionService.getUser();
      if ($state.current.url == "/thirdparty/basic/step1") {
        if ($scope.AccountsStepData == undefined) {
          $scope.AccountsStepData = SessionService.getUser();
          $scope.AccountsStepData.formActions = formActions;
        } else {
          $scope.AccountsStepData = SessionService.getAdminUser();
          $scope.AccountsStepData.formActions = formActions;
        }
        $scope.AccountsStepData.newpassword = "";
        if (SessionService.getAdminUser() == undefined && $scope.AccountsStepData.submissionData == undefined) {
          SessionService.createAdminUser($scope.AccountsStepData);
        }
        if ($scope.AccountsStepData.profilePicture == undefined || $scope.AccountsStepData.profilePicture == "") {
          $scope.AccountsStepData.profilePicture = "https://i1.sndcdn.com/avatars-000223599301-0ns076-t500x500.jpg";
        }
      } else {
        $scope.AccountsStepData = SessionService.getAdminUser();
        $scope.AccountsStepData.formActions = '';
        $scope.AccountsStepData.newpassword = "";
      }
    } else if (formActions == "Admin") {
      $scope.AccountsStepData = {};
      if ($state.current.url == "/thirdparty/basic/step1") {
        $scope.AccountsStepData = SessionService.getUser();
        $scope.AccountsStepData.formActions = formActions;
      } else {
        $scope.AccountsStepData = SessionService.getAdminUser();
        $scope.AccountsStepData.formActions = formActions;
      }
      $scope.AccountsStepData.newpassword = "";
      if (SessionService.getAdminUser() == undefined && $scope.AccountsStepData.submissionData == undefined) {
        SessionService.createAdminUser($scope.AccountsStepData);
      }
      if ($scope.AccountsStepData.profilePicture == undefined || $scope.AccountsStepData.profilePicture == "") {
        $scope.AccountsStepData.profilePicture = "https://i1.sndcdn.com/avatars-000223599301-0ns076-t500x500.jpg";
      }
    } else {
      $scope.AccountsStepData = SessionService.getAdminUser();
      $scope.AccountsStepData.formActions = '';
      $scope.AccountsStepData.newpassword = "";
    }
  } else if (formActions == "Admin") {
    $scope.AccountsStepData = {};
    if ($state.current.url == "/thirdparty/basic/step1") {
      $scope.AccountsStepData = SessionService.getUser();
      $scope.AccountsStepData.formActions = formActions;
    } else
      $scope.AccountsStepData = SessionService.getAdminUser();
  } 
});
