app.service('PrPlanService', ['$http', function($http){
	
	function savePrPlan(data) {
		return $http({
			method: 'POST',
			url: '/api/prplan',
			headers: {'Content-Type': undefined },
			transformRequest: angular.identity,
			data: data
		});
	}
	return {
		savePrPlan: savePrPlan
	};
}]);
