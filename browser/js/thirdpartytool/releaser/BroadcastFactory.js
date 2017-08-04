app.factory('BroadcastFactory', function($http){
	return {		
		submitFacebookUserPost: function(postID, data){
			return $http.post('/api/broadcast/' + postID + '/facebookuser', data);
		},
		submitFacebookPagePost: function(postID, data){
			return $http.post('/api/broadcast/' + postID + '/facebookpage', data);
		},
		submitTwitterPost: function(postID, data){
			return $http.post('/api/broadcast/' + postID + '/twitter', data);
		},
		submitYouTubePost: function(postID, data){
			return $http.post('/api/broadcast/' + postID + '/youtube',data);
		},
		submitSoundCloudPost: function(postID, data){
			return $http.post('/api/broadcast/' + postID + '/soundcloud',data);
		},
		submitInstagramPost: function(postID, data){
			return $http.post('/api/broadcast/' + postID + '/instagram',data);
		}
	};
});