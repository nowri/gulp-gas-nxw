/*
 * Initial setting
 * */
var gulp = require('gulp');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');
var del = require('del');
var dirs = {
	deploy	:	'deploy',
	release	:	'_release',
	sync	:	'_sync',
	src		:	'src'
};

gulp.task('clean:allRelease', function(cb) {
	del([dirs.release], cb);
});

gulp.task('copy:toRelease', function() {
	return gulp
		.src(
		[dirs.deploy + '/**'],
		{base: dirs.deploy}
	)
		.pipe(gulp.dest(dirs.release));
});

gulp.task('watch', function () {
	gulp.watch(dirs.src +  '/**', ['deploy']);
});

/*
 * Custom setting
 * */
var fs = require('fs');
function concatOneHtml(html, cssDir, jsDir, dist, cb) {

	var cssAr = fs.readdirSync(cssDir);
	var jsAr = fs.readdirSync(jsDir);
	var css="", js="", result=fs.readFileSync(html, "utf8");
	var htmlAr = html.split("/");
	var htmlName = htmlAr[htmlAr.length-1];

	cssAr.forEach(function(val){
		if(typeof val === "string") {
			css += "\n" + fs.readFileSync(cssDir + "/" + val, "utf8") + "\n";
		}
	});

	jsAr.forEach(function(val){
		if(typeof val === "string") {
			js += "\n" + fs.readFileSync(jsDir + "/" + val, "utf8") + "\n";
		}
	});
	result = result.replace("</body>", "<script>" + js + "</script>\n</body>");
	result = result.replace("</head>", "\n<style>" + css + "</style>\n</head>");
	try {
		fs.mkdirSync(dist);
	}catch(e){}
	fs.writeFileSync(dist + "/" + htmlName, result);
	cb();
}

gulp.task('concat', function(cb) {
	concatOneHtml("_release/index.html", "_release/css", "_release/js", "_sync", cb);
});



gulp.task('common:before', function(cb) {
	//runSequence(
		/* Common tasks here */
		//cb);
	cb();
});

gulp.task('deploy', function(cb) {
	runSequence('common:before',
		/* Deploy tasks here */
		cb);
});

gulp.task('release', function(cb) {
	runSequence(
		'common:before',
		'clean:allRelease',
		'copy:toRelease',

		cb);
});

gulp.task('sync', function(cb) {
	runSequence(
		'release',
		'concat',
		cb);
});

gulp.task('default', ['release']);

