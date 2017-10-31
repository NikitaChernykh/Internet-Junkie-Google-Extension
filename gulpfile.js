var gulp = require('gulp');
var sass = require('gulp-sass');



gulp.task('scss', function () {
  return gulp.src('./app/assets/scss/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./app/assets/styles/'));
});

gulp.task('scss-watcher',function(){
  gulp.watch('./app/assets/scss/styles.scss',['scss']);
});
