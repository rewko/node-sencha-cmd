var gulp = require('gulp'),
    gutil = require('gulp-util'),
    typescript = require('gulp-tsc');

var isWatching = false,
    production = true;

if (gutil.env.debug === true) {
    production = false;
}

gulp.task('default', ['test']);

gulp.task('lib', function () {
    return gulp.src(['./lib/*.ts'])
        .pipe(typescript({
            module: 'commonjs',
            sourcemap: !production,
            removeComments: production,
            emitError: !isWatching
        }))
        .pipe(gulp.dest('./lib'));
});

gulp.task('test', function () {
    return gulp.src(['./test/*.ts'])
        .pipe(typescript({
            module: 'commonjs',
            sourcemap: !production,
            removeComments: production,
            emitError: !isWatching
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('watch', ['test'], function () {
    isWatching = true;

    gulp.watch('./**/*.ts', ['test']);
});
