app.service('PremierService', ['$http', function($http) {

	function savePremier(data) {
		return $http({
			method: 'POST',
			url: '/api/premier',
			headers: {
				'Content-Type': undefined
			},
			transformRequest: angular.identity,
			data: data
		});
	}

	return {
		savePremier: savePremier
	};
}]);