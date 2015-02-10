var gulp = require('gulp'),
    gutil = require('gulp-util'),
    ts = require('gulp-typescript');

var production = true;

if (gutil.env.debug === true) {
    production = false;
}

var tsProject = ts.createProject({
    module: 'commonjs',
    noImplicitAny: true,
    removeComments: false
});

gulp.task('default', ['watch']);

gulp.task('lib', function () {
    return gulp.src(['./lib/*.ts'])
        .pipe(ts({
            module: 'commonjs',
            noImplicitAny: true,
            removeComments: false
        }))
        .pipe(gulp.dest('./lib'));
});

gulp.task('test', function () {
    return gulp.src([
        './lib/*.ts',
        './test/*.ts'
    ], {base: './'})
        .pipe(ts(tsProject))
        .pipe(gulp.dest('./'));
});

gulp.task('watch', ['test'], function () {
    gulp.watch('./**/*.ts', ['test']);
});
