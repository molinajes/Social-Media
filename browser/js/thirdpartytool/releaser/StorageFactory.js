app.factory('StorageFactory', function($http){
	return {
		uploadFile: function(data) {
			var fd = new FormData();
			fd.append('file', data);
			return $http({
				method: 'POST',
				url: '/api/aws',
				headers: {'Content-Type': undefined },
				tranformRequest: angular.identify,
				data: fd
			})
			.then(function (response){
				return response.data;
			});
		},
		
		addPost: function(data){
			return $http({
				method: 'POST',
				url: '/api/posts',
				data: data
			})
			.then(function (response){
				return response.data;
			});
		},

		updatePost: function(post){
			return $http({
				method: 'PUT',
				url: '/api/posts/' + post._id,
				data: {editedPost: post}
			})
			.then(function (response){
				return response.data;
			});
		},
		updateReleaseStatus: function(post){
			return $http({
				method: 'PUT',
				url: '/api/posts/' + post._id +'/status'
			})
			.then(function (response){
				return response.data;
			});
		},

		fetchAll: function(){
			return $http({
				method: 'GET',
				url: '/api/posts'
			})
			.then(function (response){
				return response.data;
			});
		},

    	getPostForEdit: function(post){
 			return $http({
				method: 'GET',
				url: '/api/posts/' + post.id
			})
			.then(function (response){
				return response.data;
			});
		},
		deletePost: function(postID){
			return $http({
				method: 'DELETE',
				url: '/api/posts/' + postID
			})
			.then(function (response){
				return response.data;
			});
		},

		deleteSingleFile: function(keyName) {
			return $http({
				method: 'DELETE',
				url: '/api/aws/' + keyName
			})
			.then(function (response){
				return response.data;
			});
		},

		deleteBothFiles: function(postID){
			return $http({
				method: 'DELETE',
				url: '/api/aws/' + postID + '/both'
			})
			.then(function (response){
				return response.data;
			});
		},

		broadcastPost: function(postID){
			return $http({
				method: 'GET',
				url: '/api/posts/' + postID + '/broadcast'
			})
			.then(function (response){
				return response.data;
			});
		},

		validateToken:function(userID,platform)
		{		
            return $http({
				method: 'GET',
				url: '/api/posts/checkTokenValidity/' + userID +'/' + platform 
			})
			.then(function (response){
				return response.data;
			});
		}
	};
});