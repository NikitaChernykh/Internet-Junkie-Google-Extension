var gulp       = require('gulp');
var sass       = require('gulp-sass');
var browserify = require('browserify');
var source     = require('vinyl-source-stream');
var csso       = require('gulp-csso');
var uglify     = require('gulp-uglify');
var buffer     = require('vinyl-buffer');

var paths = {
  scripts: {
    source: './app/Background/app.js',
    destination: './app/Background/',
    filename: 'bundle.js',
    watch: './app/Background/*.js'
  }
}

var paths2 = {
  scripts: {
    source: './app/Popup/app.js',
    destination: './app/Popup/',
    filename: 'bundle.js',
    watch: './app/Settings/*.js'
  }
}

gulp.task('browserify-bg', function () {
  var bundle = browserify({
    entries: [paths.scripts.source],
    debug: true
  });
  function createErrorHandler(name) {
    return function (err) {
      console.error('Error from ' + name + ' in compress task', err.toString());
    };
  };
  return bundle.bundle()
    .pipe(source(paths.scripts.filename))
    .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
    .pipe(uglify({ mangle: false }))
    .pipe(gulp.dest(paths.scripts.destination));
});

gulp.task('browserify-popup', function () {
  var bundle = browserify({
    entries: [paths2.scripts.source],
    debug: true
  });
  return bundle.bundle()
    .pipe(source(paths2.scripts.filename))
    .pipe(buffer()) // <----- convert from streaming to buffered vinyl file object
    .pipe(uglify({ mangle: false }))
    .pipe(gulp.dest(paths2.scripts.destination));
});

gulp.task('watch-two', function() {
  gulp.watch(paths.scripts.watch, ['browserify-bg']);
  gulp.watch(paths2.scripts.watch, ['browserify-popup']);
});

gulp.task('scss', function () {
  return gulp.src('./app/assets/scss/main.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(csso({
      restructure: false,
      sourceMap: true,
      debug: true
    }))
    .pipe(gulp.dest('./app/assets/styles/'));
});

gulp.task('scss-watcher',function(){
  gulp.watch('./app/assets/scss/main.scss',['scss']);
});

//Full build
gulp.task('watch', ['watch-two','scss-watcher']);
gulp.task('build', ['browserify-bg','browserify-popup', 'scss']);
