define(['jquery'], function () {
	'use strict';
	return {
		init: function ($el) {
			console.log('Split module is initializeing the following element:');
			console.log($el[0]);
		}
	};
});
