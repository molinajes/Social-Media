app.config(function($stateProvider) {
  $stateProvider.state('prPlans', {
    url: '/prPlans',
    templateUrl: 'js/prPlans/prPlans.html',
    controller: 'prPlansController'
  });
});

app.controller('prPlansController', function($rootScope, $state, $scope, $http, PrPlanService) {
  $scope.prPlans = {};
  $scope.processing = false;
  $scope.openSocialDialog = function(type) {
    var displayText = "";
    if (type == 'Youtube')
      displayText = "Like SoundCloud, we premiere tracks to genre-specific  audiences. We work closely with an array of well-established YouTube channels for premieres. Approaches to promotion vary across different social media platforms and requires a nuanced understanding of each.";
    if (type == 'Blog Outreach')
      displayText = "When releasing a song, it is important to keep in mind  the manner in which  blogs can affect one's reach. The blogs we work with curate music with a specific audience in mind, tending to be committed readers. We have cultivated relationships with the faces behind various blogs, and we are fortunate to have their continued support of our content.";
    if (type == 'Spotify')
      displayText = 'The third and final platform in which we can assist with releasing music is Spotify. Spotify is an online music platform which pays artist per stream. Spotify at the core is also a substantial way for artists to be heard. There are over 100 Million users worldwide  and as one of the major online music platforms, we will do our best to get your track in as many playlists as possible.';
    if (type == 'Soundcloud')
      displayText = "We facilitate premieres over our network of over six SoundCloud channels, working closely with every artist to ensure that the network genre matches the feel of their track. Though we have had better results premiering content from our various network pages, we are also able to also make the track available on the artist's personal profile and promote the track from there. We remain flexible with many of these aspects and tailor each campaign to the respective goals of the artist.";

    $.Zebra_Dialog(displayText, {
      width: 600
    });
  }
  $scope.savePrPlan = function() {
    if (!$scope.prPlans.file || !$scope.prPlans.email || !$scope.prPlans.name || !$scope.prPlans.budget) {
      $.Zebra_Dialog("Please fill in all fields")
    } else {
      $scope.processing = true;
      $scope.message.visible = false;
      var data = new FormData();
      for (var prop in $scope.prPlans) {
        data.append(prop, $scope.prPlans[prop]);
      }

      PrPlanService
        .savePrPlan(data)
        .then(receiveResponse)
        .catch(catchError);

      function receiveResponse(res) {
        $scope.processing = false;
        if (res.status === 200) {
          $scope.prPlans = {};
          angular.element("input[type='file']").val(null);
          $.Zebra_Dialog("Thank you! Your request has been submitted successfully.");
          return;
        }
        $.Zebra_Dialog("Error in processing the request. Please try again.");
      }

      function catchError(res) {
        $scope.processing = false;
        $.Zebra_Dialog("Error in processing the request. Please try again.");
      }
    }
  }
});