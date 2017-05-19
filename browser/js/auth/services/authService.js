app.factory('AuthService', ['$http', function($http){
	
	function login(data) {
		return $http.post('/api/login', data);
	}

	function signup(data) {
		return $http.post('/api/signup', data);
	}

	function thirdPartylogin(data) {		
		return $http.post('/api/login/thirdPartylogin', data);
	}

	return {
		login: login,
		signup: signup,
		thirdPartylogin:thirdPartylogin
	};
}]);
