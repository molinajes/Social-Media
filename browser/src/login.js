(function(window, $) {

	'use strict';

	$(document).ready(function() {
		$('#login-form').submit(function(event) {
			event.preventDefault();
			$.ajax({
				url: '/api/login',
				type: 'POST',
				data: $('#login-form').serialize(),
				cache: false,
				success: function(data) {
					if (data.success) {
						window.location.href = "/scheduler";
					} else {
						console.log(data);
					}
				},
				error: function(error) {
					console.log(error);
				}
			});
		});
	});


})(window, jQuery);