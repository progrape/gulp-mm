/**
 * Created by jfengjiang on 2014/12/5.
 */

var watch = require('gulp-watch');
var less = require('gulp-less');
var rename = require('gulp-rename');
var replace = require('gulp-replace');
var intercept = require('gulp-intercept');

var uglify = require('./lib/uglify');
var server = require('./lib/server');
var inline = require('./lib/inline');
var sprite = require('./lib/sprite');


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
    sprite: sprite
};


module.exports = mm;