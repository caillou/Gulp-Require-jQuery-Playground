/*global open:true, _:true */
'use strict';

var gulp = require('gulp'),
	fs = require('fs'),
	open = require('open'),
	handlebars = require('handlebars'),
	_ = require('lodash'),
	requireConfig = require('./requireConfig.json'),
	source = require('vinyl-source-stream'),
	buffer = require('vinyl-buffer'),
	streamqueue = require('streamqueue'),
	glob = require('glob'),
	path = require('path'),
	plugins = require('gulp-load-plugins')({
		pattern: 'gulp{-,.}*',
		replaceString: /gulp(\-|\.)/
	});
require('handlebars-layouts')(handlebars);

gulp.task('jshint', function () {
	return gulp.src([
			'src/**/*.js',
			'!src/bower_components/**/*.js'
		])
		.pipe(plugins.jshint('.jshintrc'))
		.pipe(plugins.jshint.reporter('default'))
		.pipe(plugins.size());
});

gulp.task('js', function (doneCallback) {
	var stream, fakeRequireConfigFile;

	// r.js and the application share the same config file.
	// Here we wrap the requireConfig.json with a require.config()
	// call and inject it into the build.
	fakeRequireConfigFile = source('fake.js');
	fakeRequireConfigFile.end(new Buffer(
		'require.config(' + JSON.stringify(requireConfig) + ');'
	));

	stream = streamqueue({ objectMode: true });

	stream.queue(gulp.src('src/bower_components/requirejs/require.js'));
	stream.queue(fakeRequireConfigFile.pipe(buffer()));

	glob(
		'src/modules/*/*.js',
		function (err, directories) {
			var includes;

			if (err) {
				throw err;
			}

			includes = directories.filter(function (file) {
				var matches = file.match(/src\/modules\/(.*)\/(.*).js$/);
				return matches[1] === matches[2];

			}).map(function (path) {
				return path.replace(/^src\//, '').replace(/.js$/, '');
			});

			stream.queue(
				plugins.requirejs({
					baseUrl: 'src/',
					out: 'main.js',
					name: 'scripts/main',
					include: includes,
					paths: requireConfig.paths
				})
			);
			stream.done()
				.pipe(plugins.concat('main.js'))
				.pipe(gulp.dest('./build/scripts/'))
				.on('end', function () {
					doneCallback();
				})
				.pipe(plugins.connect.reload());
		}
	);
});


/**
 * Compile Handlebars templates to HTML
 * Make content of data/FILENAME.json available to template engine
 */
gulp.task('html', function (doneCallback) {
	var config, pageTemplates, buildIndexPage;

	config = {};

	// Registering all partials.
	config.partials = glob.sync('{src/modules/**/*.hbs,src/layouts/**/*.hbs}')
		.reduce(function (memo, partialPath) {
			var ext, partialName;

			ext = path.extname(partialPath);
			partialName = partialPath.replace(ext, '').replace(/^src\//, '');

			memo[partialName] = '../' + partialName;
			return memo;

		}, {});

	pageTemplates = glob.sync('src/pages/**/*.hbs');

	if (!pageTemplates.length) {
		doneCallback();
		return;
	}

	buildIndexPage = _.after(
		pageTemplates.length,
		function () {
			glob('build/pages/**/*.html', function (err, pages) {
				var data = {};

				if (err) {
					throw err;
				}

				data.pages = pages.map(function (page) {
					return page.replace(/^build\//, '');
				});

				_.extend(data, config);

				gulp.src('src/index.hbs')
					.pipe(plugins.consolidate('handlebars', data, {useContents: true}))
					.pipe(plugins.extReplace('.html'))
					.pipe(gulp.dest('build'))
					.pipe(plugins.connect.reload())
					.on('end', function () {
						doneCallback();
					});
			});
		}
	);

	pageTemplates.forEach(function (pageTemplatePath) {
		var pageConfig, pageConfigFile;

		pageConfig = {};
		pageConfigFile = pageTemplatePath.replace(/.hbs$/, '.json');
		if (fs.existsSync(pageConfigFile)) {
			pageConfig = JSON.parse(
				fs.readFileSync(pageConfigFile, 'utf8')
			);
		}

		pageConfig = _.extend({}, config, pageConfig);

		gulp.src(pageTemplatePath)
			.pipe(plugins.consolidate('handlebars', pageConfig))
			.pipe(plugins.extReplace('.html'))
			.pipe(gulp.dest('build/pages'))
			.on('end', buildIndexPage);
	});
});



gulp.task('css', function () {
	return gulp.src([
			'src/**/*.css'
		], {
			base: 'src'
		})
		.pipe(gulp.dest('./build/'))
		.pipe(plugins.connect.reload());
});

// Connect
gulp.task('connect', ['html', 'js', 'css'], function () {
	plugins.connect.server({
		root: ['build'],
		port: 9000,
		livereload: true
	});
});

// Open
gulp.task('serve', ['connect'], function () {
	open('http://localhost:9000');
});

// Watch
gulp.task('watch', ['serve'], function () {
	gulp.watch('**/*.hbs', ['html']);
	gulp.watch('src/**/*.js', ['js']);
	gulp.watch('src/**/*.css', ['css']);
});

// Default task
gulp.task('default', ['watch']);
