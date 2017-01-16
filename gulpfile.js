const _ = require('lodash');
const gulp = require('gulp');
const gulpUtil = require('gulp-util');
const webpack = require('webpack');
const webpackProdConfig = require('./webpack.config.prod.js');
const fs = require('fs');
const eslint = require('gulp-eslint');
const eslintConfigJs = JSON.parse(fs.readFileSync('./.eslintrc'));
const eslintConfigConfig = JSON.parse(fs.readFileSync('./.eslintrc_config'));

let buildTask;
let webpackBuild;

// Production build
buildTask = [
    'webpack:build'
];

gulp.task('default', buildTask);
gulp.task('build', buildTask);
gulp.task('b', buildTask);

webpackBuild = function (callback) {
    const name = 'webpack:build';
    webpack(webpackProdConfig, function (err, stats) {
        if (err) {
            throw new gulpUtil.PluginError(name, err);
        }
        gulpUtil.log(`[${name}]`, stats.toString({ colors: true }));
        callback();
    });
};

gulp.task('webpack:build', webpackBuild);

function cleanTask() {
    // // TODO: write alternative for windows 9/13/16 AIM
    // if (process.platform !==
    //     'win32') {
    //     // eslint-disable-line no-undef
    //     exec('delete-invalid-files.sh', function (err, stdout, stderr) {
    //         gulpUtil.log(stdout);
    //         gulpUtil.log(stderr);
    //     });s
    // }
}

gulp.task('clean', cleanTask);

/*·.·´`·.·•·.·´`·.·•·.·´`·.·•·.·´Lint Tasks`·.·•·.·´`·.·•·.·´`·.·•·.·´`·.·•·.·´`·.·*/
gulp.task('lint', ['lint-js', 'lint-config']);

gulp.task('lint-js', function () {
    return gulp.src(['library/**/*.js', '!library/**/*.test.js'])
    // eslint() attaches the lint output to the eslint property
    // of the file object so it can be used by other modules.
    .pipe(eslint(eslintConfigJs))
    // eslint.format() outputs the lint results to the console.
    // Alternatively use eslint.formatEach() (see Docs).
    .pipe(eslint.format())
    .pipe(eslint.format('stylish', fs.createWriteStream('jslint.log')))
    // To have the process exit with an error code (1) on
    // lint error, return the stream and pipe to failAfterError last.
    .pipe(eslint.failAfterError());
});

gulp.task('lint-config', function () {
    return gulp.src(['gulpfile.js', 'webpack.config.dev.js', 'webpack.config.prod.js'])
    .pipe(eslint(_.defaultsDeep(eslintConfigConfig, eslintConfigJs)))
    .pipe(eslint.format())
    .pipe(eslint.format('stylish', fs.createWriteStream('configlint.log')))
    .pipe(eslint.failAfterError());
});
