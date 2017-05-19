app.directive('slmodal', function($http) {
  return {
    templateUrl: 'js/common/directives/shareLink/shareLink.html',
    restrict: 'EA',
    scope: {
      title: '=modalTitle',
      header: '=modalHeader',
      body: '=modalBody',
      footer: '=modalFooter',
      callbackbuttonleft: '&ngClickLeftButton',
      callbackbuttonright: '&ngClickRightButton',
      handler: '=lolo',
      eventId: '=eventId',
      event: '=event',
      trade: '=trade',
      eventType: '=eventType'
    },
    transclude: true,
    controller: function($scope, $rootScope) {
      $scope.handler = 'pop';
      $scope.origin = window.location.origin;
      $scope.makeChange = function() {

      }
      $scope.$watch('eventId', function() {
        $scope.makeChange();
        if (!!$scope.event || !!$scope.trade) {
          if ($scope.eventType == 'share') {
            $scope.shareLink = 'artistsunlimited.com/repostevents/' + $scope.event.user.soundcloud.pseudoname + "/" + $scope.event.pseudoname;
            if ($scope.event) $scope.messengerLink = 'https://' + $scope.shareLink;
            $scope.scurl = "https://soundcloud.com";
          } else {
            if ($scope.trade) {
              $scope.shareLink = 'artistsunlimited.com/artistTools/trade/' + $scope.trade.p1.user.soundcloud.pseudoname + '/' + $scope.trade.p2.user.soundcloud.pseudoname;
              $scope.messengerLink = 'https://' + $scope.shareLink;
              $scope.scurl = $scope.trade.other.user.soundcloud.permalinkURL;
            }
          }
        }
        $rootScope.reloadFB();
      });
      $scope.sendMail = function(id) {
        window.open("mailto:example@demo.com?body=" + $scope.shareLink, "_self");
      };
    },
  };
});