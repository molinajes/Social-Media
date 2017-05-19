app.service('MixingMasteringService', ['$http', function($http){
	function saveMixingMastering(data) {
		return $http({
			method: 'POST',
			url: '/api/mixingmastering',
			headers: {'Content-Type': undefined },
			transformRequest: angular.identity,
			data: data
		});
	}
	return {
		saveMixingMastering: saveMixingMastering
	};
}]);
