import { src, dest, watch, series, parallel } from 'gulp';
import concat from 'gulp-concat-css';
import plumber from 'gulp-plumber';
import { deleteAsync } from 'del';
import postcss from 'gulp-postcss';
import browserSync from 'browser-sync';
import autoprefixer from 'autoprefixer';
import mediaquery from 'postcss-combine-media-query';
import cssnano from 'cssnano';
import { minify } from 'html-minifier';
import gulpPug from 'gulp-pug';
import * as dartSass from 'sass';
import gulpSass from 'gulp-sass';

const sass = gulpSass(dartSass);

function serve() {
  browserSync.create().init({
    server: {
      baseDir: './dist',
    },
  });
}

function layoutsScss() {
  const plugins = [autoprefixer(), mediaquery(), cssnano()];
  return src('src/layouts/**/*.scss')
    .pipe(sass())
    .pipe(concat('bundle.css'))
    .pipe(postcss(plugins))
    .pipe(dest('dist/'))
    .pipe(browserSync.reload({ stream: true }));
}

function pagesScss() {
  const plugins = [autoprefixer(), mediaquery(), cssnano()];
  return src('src/pages/**/*.scss')
    .pipe(sass())
    .pipe(postcss(plugins))
    .pipe(dest('dist/'))
    .pipe(browserSync.reload({ stream: true }));
}

function pug() {
  return src('src/pages/**/*.pug')
    .pipe(
      gulpPug({
        pretty: true,
      })
    )
    .pipe(dest('dist/'))
    .pipe(browserSync.reload({ stream: true }));
}

function html() {
  const options = {
    removeComments: true,
    removeRedundantAttributes: true,
    removeScriptTypeAttributes: true,
    removeStyleLinkTypeAttributes: true,
    sortClassName: true,
    useShortDoctype: true,
    collapseWhitespace: true,
    minifyCSS: true,
    keepClosingSlash: true,
  };
  return src('src/**/*.html')
    .pipe(plumber())
    .on('data', function (file) {
      const buferFile = Buffer.from(minify(file.contents.toString(), options));
      return (file.contents = buferFile);
    })
    .pipe(dest('dist/'))
    .pipe(browserSync.reload({ stream: true }));
}

function css() {
  const plugins = [autoprefixer(), mediaquery(), cssnano()];
  return src('src/**/*.css')
    .pipe(plumber())
    .pipe(concat('bundle.css'))
    .pipe(postcss(plugins))
    .pipe(dest('dist/'))
    .pipe(browserSync.reload({ stream: true }));
}

function images() {
  return src('src/**/*.{jpg,png,svg,gif,ico,webp,avif}')
    .pipe(dest('dist/images'))
    .pipe(browserSync.reload({ stream: true }));
}

async function clean() {
  return await deleteAsync('dist');
}

function watchFiles() {
  watch(['src/**/*.pug'], pug);
  watch(['src/**/*.html'], html);
  watch(['src/**/*.css'], css);
  watch(['src/layouts/**/*.scss'], layoutsScss);
  watch(['src/pages/**/*.scss'], pagesScss);
  watch(['src/**/*.{jpg,png,svg,gif,ico,webp,avif}'], images);
}

const build = series(clean, parallel(pug, layoutsScss, pagesScss, images));
const watchapp = series(build, parallel(watchFiles, serve));

export { html, pug, css, layoutsScss, pagesScss, images, clean, build };

export default watchapp;
