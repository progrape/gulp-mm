/**
 * Created by jfengjiang on 2014/12/5.
 */

var watch = require('gulp-watch');
var less = require('gulp-less');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var tap = require('gulp-tap');
var gif = require('gulp-if');
var server = require('server-mm');
var sprite = require('gulp-spriters');
var argv = require('yargs').argv;

var inline = require('./lib/inline');
var encode = require('./lib/encode');
var i18n = require('./lib/i18n');
var uglify = require('./lib/uglify');


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
    intercept: tap,
    tap: tap,
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
    encode: encode,
    /**
     * i18n
     */
    i18n: i18n
};


module.exports = mm;