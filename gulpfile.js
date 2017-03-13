var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    concatify = require('gulp-concat'),
    cleanCSS = require('gulp-clean-css'),
    inlinesource = require('gulp-inline-source'),
    postcss = require('gulp-postcss'),
    autoprefixer = require('autoprefixer'),
    gulpSequence = require('gulp-sequence'),
    pump = require('pump');

//Paths to various files
var paths = {
    scripts: ['src/js/lib/*.js', 'src/js/app/*.js','src/js/app.js'], // concat in order and minify
    appScript: [], // inline and minify
    styles: ['src/css/*.css'], // minify autoprefixer inline app.css
    appStyle: ['src/css/app.css'], //   minify
    content: ['src/index.html'] // move
};

//Minifies and concats js files
gulp.task('scripts', function(cb) {
    var  options  =   {     preserveComments:   'license'   };
    pump([
            gulp.src(paths.scripts),
            concatify('goSightseeing.js'),
            uglify(options),
            gulp.dest('./dist/js/')
        ],
        cb
    );
});

//Minifies and autoprefixers CSS files
gulp.task('styles', function() {
    return gulp.src(paths.styles)
        .pipe(postcss([autoprefixer({ browsers: ['last 2 versions'] })]))
        .pipe(cleanCSS())
        .pipe(gulp.dest('./dist/css/'));
});

// Moves HTML file
gulp.task('moveHTML', function() {
    return gulp.src(paths.content)
        .pipe(gulp.dest('./dist/'));
});

//Inlines CSS files
gulp.task('inlinesource', function() {
    return gulp.src('dist/index.html')
        .pipe(inlinesource())
        .pipe(gulp.dest('./dist/'));
});

gulp.task('default', gulpSequence(['scripts', 'styles', 'moveHTML'], 'inlinesource'));

//Listen to JS,CSS and HTML files
gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['scripts']);
    gulp.watch(paths.styles, function(event) {
        gulpSequence('styles', 'inlinesource')(function(err) {
            if (err) console.log(err);
        });
    });
    gulp.watch(paths.content, function(event) {
        gulpSequence('moveHTML', 'inlinesource')(function(err) {
            if (err) console.log(err);
        });
    });
});
