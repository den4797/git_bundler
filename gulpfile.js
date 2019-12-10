const gulp = require('gulp');
const webpack = require('webpack-stream');
const gulpStylus = require('gulp-stylus');
const autoprefixer = require('gulp-autoprefixer');
const minifyCss = require('gulp-minify-css');
const clean = require('gulp-clean');
const pug = require('gulp-pug');
const concat = require('gulp-concat');
const imageMin = require('gulp-imagemin');
const browserSync = require('browser-sync').create();
const targetPath = require('path').resolve(__dirname, './build');

const isBuild = Array.isArray(process.argv) && process.argv.includes('build');

gulp.task('clean', () => gulp
  .src(
    [
      `${targetPath}/css`,
      `${targetPath}/js`,
      `${targetPath}/fonts`,
      `${targetPath}/img/*`,
      `!${targetPath}/img/.gitignore`,
    ],
    { allowEmpty: true },
  )
  .pipe(clean({ force: true })));

gulp.task('css', () => gulp
  .src(['markup/**/*.styl'])
  .pipe(gulpStylus())
  .pipe(concat('styles.css'))
  .pipe(autoprefixer())
  .pipe(minifyCss())
  .pipe(gulp.dest(`${targetPath}/css`)));

gulp.task('cssPlugins', () => gulp
  .src('src/css/separate/*.css')
  .pipe(autoprefixer())
  .pipe(minifyCss())
  .pipe(gulp.dest(`${targetPath}/css`)));

gulp.task('js', () => gulp
  .src(['markup/static/js/main.js'])
  .pipe(
    webpack({
      entry: {
        scripts: './markup/static/js/main.js',
      },
      mode: 'production',
      optimization: {
        minimize: isBuild,
      },
      cache: true,
      output: {
        filename: '[name].js',
        path: `${targetPath}/js`,
      },
      module: {
        rules: [
          {
            enforce: 'pre',
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'eslint-loader',
            options: {
              emitWarning: true,
            },
          },
          {
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        ],
      },
      devtool: '#inline-source-map',
    }),
  )
  .pipe(gulp.dest(`${targetPath}/js`)));

gulp.task('img', () => gulp
  .src('markup/static/img/**/*')
  .pipe(
    imageMin([
      imageMin.gifsicle({ interlaced: true }),
      imageMin.jpegtran({ progressive: true }),
      imageMin.optipng({ optimizationLevel: 5 }),
      // imageMin.svgo({ // при включении сжатия svg на некоторых иконках есть артефакты
      //   plugins: [{ removeViewBox: false }],
      // }),
    ]),
  )
  .pipe(gulp.dest(`${targetPath}/img`)));

gulp.task('fav', () => gulp
  .src(`${targetPath}/img/fav/*`)
  .pipe(clean({ force: true }))
  .pipe(gulp.dest(`${targetPath}/`)));

gulp.task('fonts', () => gulp.src('markup/static/fonts/**/*').pipe(gulp.dest(`${targetPath}/fonts`)));

gulp.task('html', () => gulp
  .src(['markup/pages/index.pug'])
  .pipe(pug({ pretty: true }))
  .pipe(gulp.dest(`${targetPath}`)));

gulp.task('watch', () => {
  gulp.watch('markup/**/*.styl', gulp.series('css')).on('change', browserSync.reload);
  gulp.watch('markup/**/*.js', gulp.series('js')).on('change', browserSync.reload);
  gulp.watch('markup/static/img/**/*', gulp.series('img')).on('change', browserSync.reload);
  gulp
    .watch(['markup/pages/**/*', 'markup/components/**/*'], gulp.series('html'))
    .on('change', browserSync.reload);

  browserSync.init({
    server: {
      baseDir: './build',
    },
  });
});

gulp.task('build', gulp.series('clean', 'html', 'fonts', 'cssPlugins', 'css', 'js', 'img', 'fav'));
gulp.task('default', gulp.series('build', 'watch'));
