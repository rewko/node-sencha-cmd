var gulp = require('gulp'),
    typescript = require('gulp-tsc');

var isWatching = false,
    production = true;

gulp.task('default', ['test']);

gulp.task('lib', function () {
    return gulp.src(['./lib/*.ts'])
        .pipe(typescript({
            module: 'commonjs',
            sourcemap: !production,
            removeComments: production,
            emitError: false
        }))
        .pipe(gulp.dest('./lib'));
});

gulp.task('test', function () {
    return gulp.src(['./test/*.ts'])
        .pipe(typescript({
            module: 'commonjs',
            sourcemap: !production,
            removeComments: production,
            emitError: false
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('watch', ['test'], function () {
    gulp.watch('./**/*.ts', function () {
        isWatching = true;
        gulp.start('test');
    });
});
