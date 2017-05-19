app.service('AdminToolsService', ['$http', function($http) {

	function resolveData(data) {
		return $http.post('/api/soundcloud/resolve', data);
	}

	function getDownloadList(userid) {
		return $http.get('/api/database//downloadurladmin/'+userid);
	}

	function getDownloadGateway(data) {
		return $http.get('/api/database/downloadurl/' + data.id);
	}

	function deleteDownloadGateway(data) {
		return $http.post('/api/database/downloadurl/delete', data);
	}

	function saveProfileInfo(data) {
		return $http.post('/api/database/profile/edit', data);
	}

	function saveSoundCloudAccountInfo(data) {
		return $http.post('/api/database/profile/soundcloud', data);
	}

	function getTrackListFromSoundcloud(data) {
		return $http.post('/api/database/tracks/list', data);
	}

	return {
		resolveData: resolveData,
		getDownloadList: getDownloadList,
		getDownloadGateway: getDownloadGateway,
		saveProfileInfo: saveProfileInfo,
		deleteDownloadGateway: deleteDownloadGateway,
		saveSoundCloudAccountInfo: saveSoundCloudAccountInfo,
		getTrackListFromSoundcloud: getTrackListFromSoundcloud
	};
}]);