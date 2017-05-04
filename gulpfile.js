var gulp = require('gulp');
var gulpif = require('gulp-if');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync').create();
var uglify = require('gulp-uglify');
var pump = require('pump');
var concat = require('gulp-concat')
var rename = require("gulp-rename");
var minify = require('gulp-clean-css');
var imagemin = require('gulp-imagemin');
var jsonfile = require('jsonfile');
var panini = require('panini');
var purify = require('gulp-purifycss');
var tinypng = require('gulp-tinypng-compress');
var svgSprite = require('gulp-svg-sprite');

gulp.task('svgSprite', () =>
    gulp.src(config.source + 'img/*.svg')
	.pipe(svgSprite({
            mode: {
                // inline: true,
                symbol:  {
                    dest: "",	
                    sprite : "sprite.svg",
                    // bust: true,
                }
            }
        }))
	.pipe(gulp.dest(config.dist + 'img'))
);



var config = jsonfile.readFileSync('./config.json');

var sassPaths = [
    'bower_components/foundation-sites/scss',
    'bower_components/motion-ui/src',
    'node_modules/normalize.css',
];

gulp.task('imagemin-svg', () =>
    gulp.src(config.source + 'img/*.svg')
        .pipe(imagemin())
        .pipe(gulp.dest(config.dist + 'img'))
);

 
gulp.task('tinypng', function () {
    gulp.src(config.source + 'img/*.{png,jpg,jpeg}')
        .pipe(tinypng({
            key: 'cvgVuitXUIQqFq8qlAVF9u8y_weEqmYL',
            sigFile: config.source + 'img/.tinypng-sigs',
            log: true
        }))
    .pipe(gulp.dest(config.dist + 'img'));
});

gulp.task('sass', function () {
    return gulp.src(config.source + 'scss/app.scss')
        .pipe($.sourcemaps.init())
        .pipe($.sass({
            includePaths: sassPaths,
            // outputStyle: 'compressed' // if css compressed **file size**
        })
        .on('error', $.sass.logError))
        .pipe($.autoprefixer({
            browsers: ['last 2 versions', 'ie >= 9']
        }))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest(config.dist + 'css'))
        .pipe(browserSync.reload({ stream: true }));
});

gulp.task('pages', function() {
  gulp.src(config.source + 'templates/pages/**/*.{html,hbs,handlebars}')
    .pipe(panini({
      root: config.source + 'templates/pages/',
      layouts: config.source + 'templates/layouts/',
      partials: config.source + 'templates/partials/',
      helpers: config.source + 'templates/helpers/',
      data: config.source + 'templates/data/'
    }))
    .pipe(gulp.dest(config.dist));
});

gulp.task('pages:reset', function(done) {
    panini.refresh()
    gulp.run('pages');
    done();
})

gulp.task('browser-sync', function () {
    browserSync.init({
        "server": {
            "baseDir": config.dist
        },
        open: false
    });
});


gulp.task('js', function (cb) {
    pump([
        gulp.src([
            'node_modules/jquery/dist/jquery.min.js',
            'bower_components/foundation-sites/dist/foundation.min.js',
            'bower_components/dist/jquery.validate.min.js',
            'bower_components/what-input/what-input.js',
            config.source + 'js/app.js'
            ]),
        concat('app.js'),
        uglify(),
        rename({ suffix: '.min' }),
        gulp.dest(config.dist + 'js')
    ],
        cb
    );
});


gulp.task('compress-sass', ['sass'], function () {
    return gulp.src(config.dist + 'css/app.css')
        .pipe(rename({ suffix: '.min' }))
        .pipe(minify())
        .pipe(gulp.dest(config.dist + 'css'));
});

gulp.task('purify-css', ['js', 'compress-sass'], function() {
    return gulp.src('./dist/css/*.css')
        .pipe(purify(['./dist/js/**/*.js', './dist/**/*.html']))
        .pipe(gulp.dest('./dist/css'));
});

gulp.task('fonts', () => {
    return gulp.src(config.source + '/fonts/**')
        .pipe(gulp.dest(config.dist ));
});

// gulp.task('dropbox', function() {
//     return gulp.src(config.dist + '/**/*')
//     .pipe(gulp.dest('/Users/atomeon/Dropbox/cabinet-markup'));
// });

gulp.task('build', ['pages', 'purify-css', 'tinypng', 'imagemin-svg']);

gulp.task('serve', ['pages', 'tinypng', 'imagemin-svg', 'fonts', 'js', 'compress-sass', 'browser-sync'], function () {
    gulp.watch([config.source + 'templates/pages/**/*'], ['pages']);
    gulp.watch([config.source + 'templates/{layouts,partials,helpers,data}/**/*'], ['pages:reset']);
    gulp.watch([config.source + 'scss/**/*.scss'], ['sass', 'compress-sass']);
    gulp.watch([config.source + 'css/*.css']).on('change', browserSync.reload);
    gulp.watch([config.source + 'js/*.js'], ['js']);
    gulp.watch([config.source + 'js/*.js']).on('change', browserSync.reload);
    gulp.watch([config.source + 'img/*'], ['tinypng']);
    gulp.watch([config.source + 'img/*'], ['imagemin-svg']);
    gulp.watch([config.dist + 'img/*']).on('change', browserSync.reload);
    gulp.watch([config.dist + "*.html"]).on('change', browserSync.reload);
});

gulp.task('default', ['serve']);