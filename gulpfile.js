// gulpfile.js - https://jsua.co/mm-gulp

'use strict'; // http://www.w3schools.com/js/js_strict.asp

// 1. LOAD PLUGINS

var gulp = require('gulp');
var bourbon = require('bourbon').includePaths;
var neat = require('bourbon-neat').includePaths;
var p = require('gulp-load-plugins')({ // This loads all the other plugins.
  DEBUG: false,
  pattern: ['gulp-*', 'gulp.*', 'del', 'run-*', 'browser*', 'vinyl-*'],
  rename: {
    'vinyl-source-stream': 'source',
    'vinyl-buffer': 'buffer',
    'gulp-util': 'gutil'
  },
});
var rename = require('gulp-rename');
var uglify = require('gulp-uglify');

// 2. CONFIGURATION

var
  src  = 'source/', // The Middleman source folder
  dest = '.tmp/',   // The "hot" build folder used by Middleman's external pipeline

  development = p.environments.development,
  production = p.environments.production,

  css = {
    in: src + 'css/**/*.{css,scss,sass}',
    out: dest + 'css/',
  },

  sassOpts = {
    imagePath: '../img',
    includePaths: [bourbon, neat],
    errLogToConsole: true
  },

  autoprefixerOpts = {
    browsers: ['last 3 versions', '> 5%']
  },

  js = {
    in: src + 'js/*.{js,coffee}',
    out: dest + 'js/'
  },

  uglifyOpts = {
    output: {
      comments: 'uglify-save-license'
    }
  },

  images = {
    in: src + 'img/*.{png,jpg,svg}',
    out: dest + 'img/'
  },

  serverOpts = {
    proxy: 'localhost:4567',
    open: true,
    reloadDelay: 700,
    files: [dest + '**/*.{js,css}', src + '**/*.{html,erb,markdown}']
  };

// 3. WORKER TASKS

// CSS Preprocessing
gulp.task('css', function() {
  return gulp.src(css.in)
    .pipe(development(p.sourcemaps.init()))
    .pipe(p.sass(sassOpts).on('error', p.sass.logError))
    .pipe(p.autoprefixer(autoprefixerOpts)).on('error', handleError)
    .pipe(production(p.cleanCss()))
    .pipe(rename({suffix: '.min'}))
    .pipe(development(p.sourcemaps.write()))
    .pipe(gulp.dest(css.out));
});

// Javascript Bundling
gulp.task('js', function() {
  var b = p.browserify({
    entries: src + 'js/theme.js',
    debug: true
  });

  return b.bundle().on('error', handleError)
    .pipe(p.source('theme.js'))
    .pipe(production() ? p.buffer() : p.gutil.noop())
    .pipe(production(p.stripDebug()))
    .pipe(production() ? p.uglify(uglifyOpts) : p.gutil.noop())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(js.out));

});

// Javascript Bundling
gulp.task('js', function() {
  var b = p.browserify({
    entries: src + 'js/theme.js',
    debug: true
  });

  return b.bundle().on('error', handleError)
    .pipe(p.source('theme.js'))
    .pipe(production() ? p.buffer() : p.gutil.noop())
    .pipe(production(p.stripDebug()))
    .pipe(production() ? p.uglify(uglifyOpts) : p.gutil.noop())
    .pipe(rename({suffix: '.min'}))
    .pipe(gulp.dest(js.out));
});




// Image Optimization
gulp.task('images', function() {
  return gulp.src(images.in)
    .pipe(p.changed(images.out))
    // .pipe(p.imagemin()) //bug still unresolved: https://github.com/sindresorhus/gulp-imagemin/issues/245
    .pipe(gulp.dest(images.out));
});

// Clean .tmp/
gulp.task('clean', function() {
  p.del([
    dest + '*'
  ]);
});

// Asset Size Report
gulp.task('sizereport', function () {
  return gulp.src(dest + '**/*')
    .pipe(p.sizereport({
      gzip: true
    }));
});

// 4. SUPER TASKS

// Development Task
gulp.task('development', function(done) {
  p.runSequence('clean', 'css', 'js', 'images', done);
});

// Production Task
gulp.task('production', function(done) {
  p.runSequence('clean', 'css', 'js', 'images', 'sizereport', done);
});

// Default Task
// This is the task that will be invoked by Middleman's exteranal pipeline when
// running 'middleman server'
gulp.task('default', ['development'], function() {

  p.browserSync.init(serverOpts);

  gulp.watch(css.in, ['css']);
  gulp.watch(js.in, ['js']);
  gulp.watch(images.in, ['images']);

});

function handleError(err) {
  console.log(err.toString());
  this.emit('end');
}
