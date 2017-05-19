app.service('accountService', ['$http', function($http) {

	function deleteUserAccount(id) {
		return $http({
				method: 'put',
				url: '/api/database/deleteUserAccount/' + id
			})
			.then(function(response) {
				return response.data;
			});
	}

	return {
		deleteUserAccount: deleteUserAccount
	};
}]);