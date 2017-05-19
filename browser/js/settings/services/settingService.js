app.factory('SettingService', ['$http', function($http) {

    function updateAdminProfile(data) {
        return $http.post('/api/users/updateAdminProfile', data);
    }

    function getSaltPassword(data) {
        return $http.get('/api/users/getSaltPassword/pswd=' + data.password);
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
        uploadFile: uploadFile
    };
}]);