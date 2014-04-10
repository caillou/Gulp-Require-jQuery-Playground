/*global $:true, open:true */
'use strict';

var gulp = require('gulp');
var open = require('open');

// Load plugins
var $ = require('gulp-load-plugins')();

// Scripts
gulp.task('scripts', function () {
	return gulp.src('app/scripts/**/*.js')
		.pipe($.jshint('.jshintrc'))
		.pipe($.jshint.reporter('default'))
		.pipe($.size());
});

// Default task
gulp.task('default', ['watch']);

// Connect
gulp.task('connect', function () {
	$.connect.server({
		root: ['app'],
		port: 9000,
		livereload: true
	});
});

// Open
gulp.task('serve', ['connect'], function() {
	open('http://localhost:9000');
});


// Watch
gulp.task('watch', ['connect', 'serve'], function () {
	// Watch for changes in `app` folder
	gulp.watch([
		'app/*.html',
		'app/styles/**/*.css',
		'app/scripts/**/*.js',
		'app/images/**/*'
	], function (event) {
		return gulp.src(event.path)
			.pipe($.connect.reload());
	});


	// Watch .js files
	// gulp.watch('app/scripts/**/*.js', ['scripts']);

});
