app.factory('SessionService', function($cookies, $http, $window, $state) {

	function create(data) {
		console.log(data);
		data.pseudoAvailableSlots = createPseudoAvailableSlots(data);
		$window.localStorage.setItem('user', JSON.stringify(data));
	}

	function deleteUser() {
		$window.localStorage.removeItem('user');
		$window.localStorage.removeItem('AdminUser');
		$window.localStorage.removeItem('addActionsfoAccount');
		$window.localStorage.removeItem('addActionsfoAccountIndex');
		$window.localStorage.removeItem('addActionsfoAccountIndexSRD');
		$window.localStorage.removeItem('soundCloudId');
		$window.localStorage.removeItem('PaidRepostAccounts');
		$window.localStorage.removeItem('isAdminAuthenticate');
	}

	function removeAccountusers() {
		$window.localStorage.removeItem('addActionsfoAccount');
		$window.localStorage.removeItem('addActionsfoAccountIndex');
		$window.localStorage.removeItem('addActionsfoAccountIndexSRD');
		$window.localStorage.removeItem('AdminUser');
		$window.localStorage.removeItem('soundCloudId');
		$window.localStorage.removeItem('PaidRepostAccounts');
	}

	function addActionsfoAccount(actions, index, soundCloudId) {
		$window.localStorage.setItem('addActionsfoAccount', actions);
		$window.localStorage.setItem('addActionsfoAccountIndex', index);
		if (soundCloudId) {
			$window.localStorage.setItem('addActionsfoAccountIndexSRD', index);
			$window.localStorage.setItem('soundCloudId', soundCloudId);
		}
	}

	function removePaidRepostAccounts() {
		$window.localStorage.removeItem('PaidRepostAccounts');
	}

	function getActionsfoAccount() {
		return $window.localStorage.getItem('addActionsfoAccount');
	}

	function getActionsfoAccountIndex() {
		return $window.localStorage.getItem('addActionsfoAccountIndex');
	}

	function addActionsfoAccountIndexSRD() {
		return $window.localStorage.getItem('addActionsfoAccountIndexSRD');
	}

	function getSoundCloudId() {
		return $window.localStorage.getItem('soundCloudId');
	}

	function getUser() {
		try {
			var user = JSON.parse($window.localStorage.getItem('user'));
			if (user) {
				return user;
			}
		} catch (e) {}
	}

	function createAdminUser(data) {
		$window.localStorage.setItem('AdminUser', JSON.stringify(data));
	}

	function setUserPaidRepostAccounts(data) {
		$window.localStorage.setItem('PaidRepostAccounts', JSON.stringify(data));
	}

	function getUserPaidRepostAccounts(id) {
		if (id != undefined) {
			try {
				var accounts = JSON.parse($window.localStorage.getItem('PaidRepostAccounts'));
				if ((typeof accounts === "object") && (accounts !== null)) {
					return accounts;
				} else {
					var user = accounts.find(function(acc) {
						return acc._id == id;
					});
					console.log("user", user);
					return user;
				}
			} catch (e) {}
		}
	}

	function getAdminUser() {
		try {
			var user = JSON.parse($window.localStorage.getItem('AdminUser'));
			if (user) {
				return user;
			}
		} catch (e) {}
	}

	function refreshUser() {
		var curUser = getUser();
		if (curUser) {
			$http.get('/api/users/byId/' + curUser._id)
				.then(function(res) {
					create(res.data);
				}).then(null, function() {
					if (window.location.pathname.indexOf('artistTools') != -1) {
						$window.localStorage.removeItem('user');
						$state.go('login')
					} else if (window.location.pathname.indexOf('admin') != -1) {
						$window.localStorage.removeItem('user');
						$state.go('admin')
					} else {
						$window.localStorage.removeItem('user');
					}

				})
		}
	}

	return {
		create: create,
		deleteUser: deleteUser,
		getUser: getUser,
		refreshUser: refreshUser,
		createAdminUser: createAdminUser,
		getAdminUser: getAdminUser,
		removeAccountusers: removeAccountusers,
		addActionsfoAccount: addActionsfoAccount,
		getActionsfoAccount: getActionsfoAccount,
		getActionsfoAccountIndex: getActionsfoAccountIndex,
		setUserPaidRepostAccounts: setUserPaidRepostAccounts,
		getUserPaidRepostAccounts: getUserPaidRepostAccounts,
		removePaidRepostAccounts: removePaidRepostAccounts,
		getSoundCloudId: getSoundCloudId,
		addActionsfoAccountIndexSRD: addActionsfoAccountIndexSRD
	};
});