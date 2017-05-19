
app.service('AdminDLGateService', ['$http', function($http){

	function resolveData(data) {
		return $http.post('/api/soundcloud/resolve', data);
	}

	function getDownloadList() {
		return $http.get('/api/database/downloadurl/admin');
	}

	function getDownloadGateway(data) {
		return $http.get('/api/database/downloadurl/' + data.id);
	}

	function deleteDownloadGateway(data) {
		return $http.post('/api/database/downloadurl/delete', data);
	}

	return {
		resolveData: resolveData,
		getDownloadList: getDownloadList,
		getDownloadGateway: getDownloadGateway,
		deleteDownloadGateway: deleteDownloadGateway
	};
}]);
