app.service('DownloadTrackService', ['$http', function($http) {

	function getDownloadTrack(data) {
		return $http.get('/api/download/track?trackID=' + data);
	}

	function getDownloadTrackByUrl(data) {
		return $http.get('/api/download/trackByURL/'+data.username+'/'+data.title);
	}

	function getTrackData(data) {
		return $http.post('/api/soundcloud/resolve', {
			url: data.trackURL
		});
	}

	function performTasks(data) {
		return $http.post('api/download/tasks', data);
	}

	function getRecentTracks(data) {
		return $http.get('/api/download/track/recent?userID=' + data.userID + '&trackID=' + data.trackID);
	}

	return {
		getDownloadTrack: getDownloadTrack,
		getDownloadTrackByUrl: getDownloadTrackByUrl,
		getTrackData: getTrackData,
		performTasks: performTasks,
		getRecentTracks: getRecentTracks
	};
}]);