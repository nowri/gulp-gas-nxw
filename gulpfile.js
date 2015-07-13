/*
 * Initial setting
 * */
var gulp = require('gulp');
var watch = require('gulp-watch');
var runSequence = require('run-sequence');
var del = require('del');
var dirs = {
    deploy: 'deploy',
    release: '_release',
    sync: '_syncgas',
    src: 'src'
};

gulp.task('clean:allRelease', function (cb) {
    del([dirs.release], cb);
});

gulp.task('copy:toRelease', function () {
    return gulp
        .src(
        [dirs.deploy + '/**'],
        {base: dirs.deploy}
    )
        .pipe(gulp.dest(dirs.release));
});

gulp.task('watch:deploy', function () {
    gulp.watch(dirs.src + '/**', ['deploy']);
});

gulp.task('watch:render-and-upload', function () {
    gulp.watch([dirs.src + '/**', dirs.sync + '/main.js'], ['sync-and-upload']);
});

/*
 * Custom setting
 * */
var fs = require('fs');
var cheerio = require('cheerio');
var _ = require('lodash');
var gasParams = {
    'file_id': 'CHANGE_YOUR_FILE_ID',
    'refresh_token': 'CHANGE_YOUR_REFLESH_TOKEN',
    'client_id': 'CHANGE_YOUR_CLIENT_ID',
    'client_secret': 'CHANGE_YOUR_CLIENT_SECRET'
};
var Manager = require('gas-manager').Manager;
var manager = new Manager({
    'refresh_token': gasParams.refresh_token,
    'client_id': gasParams.client_id,
    'client_secret': gasParams.client_secret
});

function concatOneHtml(html, srcRoot, dist, cb) {

    var css = '';
    var js = '';
    var result = fs.readFileSync(html, 'utf8');
    var htmlAr = html.split('/');
    var htmlName = htmlAr[htmlAr.length - 1];

    var $ = cheerio.load(result);

    var jsList = [];
    $('script').each(function (index, el) {
        var $this = $(el);
        var src = $this.attr('src');
        if (src) {
            jsList.push(src);
            $this.remove();
        }
    });
    jsList.forEach(function (val) {
        if (typeof val === 'string') {
            js += '\n' + fs.readFileSync(srcRoot + '/' + val, 'utf8') + '\n';
        }
    });
    var cssList = [];
    $('link').each(function (index, el) {
        var $this = $(el);
        var href = $this.attr('href');
        var rel = $this.attr('rel');
        if (href && rel.toUpperCase() === 'STYLESHEET') {
            cssList.push(href);
            $this.remove();
        }
    });
    cssList.forEach(function (val) {
        if (typeof val === 'string') {
            css += '\n' + fs.readFileSync(srcRoot + '/' + val, 'utf8') + '\n';
        }
    });
    $('head')
        .append('<style id=\"concat-css\" />')
        .append('<script id=\"concat-js\"></script>');
    $('#concat-css').text(css);
    $('#concat-js').text(js);
    result = $.html();
    try {
        fs.mkdirSync(dist);
    } catch (e) {
    }
    fs.writeFileSync(dist + '/' + htmlName, result);
    cb();
}

gulp.task('concat', function (cb) {
    concatOneHtml('_release/index.html', '_release', dirs.sync, cb);
});


gulp.task('common:before', function (cb) {
    //runSequence(
    /* Common tasks here */
    //cb);
    cb();
});

gulp.task('deploy', function (cb) {
    runSequence('common:before',
        /* Deploy tasks here */
        cb);
});

gulp.task('release', function (cb) {
    runSequence(
        'common:before',
        'clean:allRelease',
        'copy:toRelease',

        cb);
});

gulp.task('gas-render', function (cb) {
    runSequence(
        'release',
        'concat',
        cb);
});

gulp.task('gas-upload', function (cb) {
    manager.getProject(gasParams.file_id, function (res, gasProject) {
        var origin = gasProject.origin;
        var files = fs.readdirSync(dirs.sync);
        origin.files.forEach(function (el, i) {
            var oName = el.name;
            files.forEach(function (el2, j) {
                var _name = el2.split('.')[0];
                var obj, src;
                if (_name === oName) {
                    obj = _.clone(el);
                    src = fs.readFileSync(dirs.sync + el2, 'utf8');
                    obj.source = src;
                    gasProject.changeFile(oName, obj)
                }
            });
        });
        gasProject.deploy(function (err, project, response) {
                if (err) {
                    throw new Error(err)
                }
                cb();
            }
        );
    });
});

gulp.task('render-and-upload', function (cb) {
    runSequence(
        'gas-render',
        'gas-upload',
        cb);
});


gulp.task('default', ['release']);

