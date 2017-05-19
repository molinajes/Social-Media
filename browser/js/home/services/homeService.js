

app.service('HomeService', ['$http', function($http){
	
	function saveApplication(data) {
		return $http.post('/api/home/application', data);
	}

	function saveArtistEmail(data) {
		return $http.post('/api/home/artistemail', data);
	}

	return {
		saveApplication: saveApplication,
		saveArtistEmail: saveArtistEmail
	};
}]);
