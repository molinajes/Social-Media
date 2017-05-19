app.directive('fileInput', ['$parse', function($parse){
	return {
		restrict:'A',
		link:function(scope,elm,attrs){
			elm.bind('change', function(){
				$parse(attrs.fileInput) // the attr is where we define 'file' as the model
				.assign(scope,elm[0].files[0]);
				scope.$apply(); 
			});
		}
	};
}]);