var sass = require('gulp-sass'),
    handlebars = require('gulp-compile-handlebars'),
    gulp = require('gulp-param')(require('gulp'), process.argv),
    runSequence = require('run-sequence'),
    csso = require('gulp-csso'),
    uglify = require('gulp-uglify'),
    concat = require('gulp-concat'),
    gzip = require('gulp-gzip'),
    autoprefixer = require('autoprefixer'),
    postcss = require('gulp-postcss'),
    sourcemaps = require('gulp-sourcemaps'),
    jsModules = ['js/variables.js', 'js/libs.js', 'js/socket.js', 'js/cookies.js', 'js/templater.js', 'js/history.js', 'js/prototype.js', 'js/other.js'];

gulp.task('update', function () {
    runSequence('js');
    runSequence('scss');
});

gulp.task('js', function () {
    gulp.src(jsModules)
        .pipe(sourcemaps.init())
        .pipe(concat('core.js'))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('../app/public/js/'));
});

gulp.task('templates', function () {
    gulp.src('templates/*.js')
        .pipe(gulp.dest('../app/public/templates/'))
        .pipe(gulp.dest('../app/templates/'));
});

gulp.task('prototypes', function () {
    gulp.src('prototypes/*.js')
        .pipe(gulp.dest('../app/public/prototypes/'));
});

gulp.task('sockets', function () {
    gulp.src('sockets/*.js')
        .pipe(gulp.dest('../app/public/sockets/'));
});

gulp.task('scss', function () {
    gulp.src('scss/*.scss')
        .pipe(sourcemaps.init())
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([autoprefixer()]).on('error', swallowError))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('../app/public/css/'));
});

gulp.task('compress', function () {
    gulp.src(jsModules)
        .pipe(uglify().on('error', swallowError))
        .pipe(concat('core.js').on('error', swallowError))
        .pipe(gulp.dest('../app/public/js/'));

    gulp.src('prototypes/*.js')
        .pipe(uglify().on('error', swallowError))
        .pipe(gulp.dest('../app/public/prototypes/'));

    gulp.src('sockets/*.js')
        .pipe(uglify().on('error', swallowError))
        .pipe(gulp.dest('../app/public/sockets/'));

    gulp.src('templates/*.js')
        .pipe(uglify().on('error', swallowError))
        .pipe(gulp.dest('../public/templates/'))
        .pipe(gulp.dest('../app/templates/'));

    gulp.src('scss/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(postcss([autoprefixer()]).on('error', swallowError))
        .pipe(csso().on('error', swallowError))
        .pipe(gulp.dest('../app/public/css/'));
});

gulp.task('watch', function () {
    gulp.watch('scss/**/*.scss', ['scss']);
    gulp.watch('js/**/*.js', ['js']);
    gulp.watch('templates/**/*.js', ['templates']);
    gulp.watch('prototypes/**/*.js', ['prototypes']);
    gulp.watch('sockets/**/*.js', ['sockets']);
});

function swallowError(error) {
    console.log(error.toString());
    this.emit('end');
}