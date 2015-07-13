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
var cheerio = require('cheerio');

function concatOneHtml(html, srcRoot, dist, cb) {

	var css = "";
	var js = "";
	var result = fs.readFileSync(html, "utf8");
	var htmlAr = html.split("/");
	var htmlName = htmlAr[htmlAr.length-1];

	var $ = cheerio.load(result);

	var jsList = [];
	$("script").each( function(index, el) {
		var $this = $(el);
		var src = $this.attr("src");
		if(src) {
			jsList.push(src);
			$this.remove();
		}
	});
	jsList.forEach(function(val){
		if(typeof val === "string") {
			js += "\n" + fs.readFileSync(srcRoot + "/" + val, "utf8") + "\n";
		}
	});
	var cssList = [];
	$("link").each( function(index, el) {
		var $this = $(el);
		var href = $this.attr("href");
		var rel = $this.attr("rel");
		if(href && rel.toUpperCase() === "STYLESHEET") {
			cssList.push(href);
			$this.remove();
		}
	});
	cssList.forEach(function(val){
		if(typeof val === "string") {
			css += "\n" + fs.readFileSync(srcRoot + "/" + val, "utf8") + "\n";
		}
	});
	$("head")
		.append("<style id=\"concat-css\" />")
		.append("<script id=\"concat-js\"></script>");
	$("#concat-css").text(css);
	$("#concat-js").text(js);
	result = $.html();
	try {
		fs.mkdirSync(dist);
	}catch(e){}
	fs.writeFileSync(dist + "/" + htmlName, result);
	cb();
}

gulp.task('concat', function(cb) {
	concatOneHtml("_release/index.html", "_release", "_sync", cb);
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

