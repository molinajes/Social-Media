app.factory('AuthService', ['$http', function($http){
	
	function login(data) {
		return $http.post('/api/login', data);
	}
	function subadmin(data) {
		console.log("rascal_subadmin RASCALuik19631993");
		return $http.post('api/thirdpartyuser/login', data);
	}
	function signup(data) {
		return $http.post('/api/signup', data);
	}

	function thirdPartylogin(data) {		
		return $http.post('/api/login/thirdPartylogin', data);
	}

	return {
		login: login,
		subadmin: subadmin,
		signup: signup,
		thirdPartylogin:thirdPartylogin
	};
}]);
