app.factory('AccountSettingServices', ['$http', function($http) {

    function updateAdminProfile(data) {
        return $http.post('/api/users/updateAdminProfile', data);
    }

    function updateUserAvailableSlot(data) {
        return $http.put('/api/users/updateuserRecord', data);
    }

    function updatePaidRepost(data) {
        return $http.post('/api/users/updatePaidRepost', data);
    }

    function getSaltPassword(data) {
        return $http.get('/api/users/getSaltPassword/pswd=' + data.password);
    }

    function addCustomize(data) {
        return $http.post('/api/customsubmissions/addCustomSubmissions', data);
    }

    function checkUsercount(data) {
        return $http.post('/api/users/checkUsercount', data);
    }

    function uploadFile(data) {
        var fd = new FormData();
        fd.append('file', data);
        return $http({
                method: 'POST',
                url: '/api/users/profilePicUpdate',
                headers: {
                    'Content-Type': undefined
                },
                tranformRequest: angular.identify,
                data: fd
            })
            .then(function(response) {
                return response.data;
            });
    }

    return {
        getSaltPassword: getSaltPassword,
        updateAdminProfile: updateAdminProfile,
        uploadFile: uploadFile,
        checkUsercount: checkUsercount,
        addCustomize: addCustomize,
        updateUserAvailableSlot: updateUserAvailableSlot,
        updatePaidRepost: updatePaidRepost
    };
}]);