require(['jquery'], function () {
	'use strict';
	$(function ($) {
		$('[data-require]').each(function () {
			var $this, modulesToRequireAndInitialize;

			$this = $(this);

			modulesToRequireAndInitialize = $this.data('require').split(' ');

			modulesToRequireAndInitialize.map(function (moduleName) {
				return 'modules/' + moduleName + '/' + moduleName;
			}).forEach(function (moduleName) {

				require([moduleName], function (module) {
					module.init($this);
				});
			});
		});
	});
});
