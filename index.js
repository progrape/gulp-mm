/**
 * Created by jfengjiang on 2014/12/5.
 */

var watch = require('gulp-watch');
var less = require('gulp-less');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var minify = require('gulp-clean-css');
var uglify = require('gulp-uglify');
var intercept = require('gulp-intercept');
var gif = require('gulp-if');
var argv = require('yargs').argv;

var server = require('./lib/server');
var inline = require('./lib/inline');
var sprite = require('./lib/sprite');
var encode = require('./lib/encode');


var mm = {
    /**
     * gulp-watch
     */
    watch: watch,
    /**
     * gulp-less
     */
    less: less,
    /**
     * gulp-rename
     */
    rename: rename,
    /**
     * gulp-replace
     */
    replace: replace,
    /**
     * gulp-intercept
     */
    intercept: intercept,
    /**
     * argv
     */
    argvs: argv,
    /**
     * gulp-if
     */
    gif: gif,
    /**
     * uglify
     */
    uglify: uglify,
    /**
     * minify
     */
    minify: minify,
    /**
     * server with socket
     */
    server: server,
    /**
     * inline
     */
    inline: inline,
    /**
     * sprite
     */
    sprite: sprite,
    /**
     * encode
     */
    encode: encode
};


module.exports = mm;