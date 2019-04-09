const gulp = require('gulp');
const browserify = require('browserify');
var source = require('vinyl-source-stream');

gulp.task('build' , () =>{
    const background = browserify({
        entries: './background.js',
        debug: true
    });
    return background.bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./'));
})