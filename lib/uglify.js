/**
 * Created by jfengjiang on 2014/12/5.
 */

var path = require('path');
var through = require('through2');
var uglify = require('uglify-js');
var cleanCSS = require('clean-css');
var htmlmin = require('html-minifier');

module.exports = function(){
    return through.obj(function(file, encoding, callback){
        switch(path.extname(file.path)){
            case '.js':
                var result = uglify.minify(file.contents.toString(), {fromString: true});
                file.contents = new Buffer(result.code);
                break;
            case '.css':
                file.contents = new Buffer(new cleanCSS().minify(file.contents.toString()));
                break;
            case '.html':
                file.contents = new Buffer(htmlmin.minify(file.contents.toString()));
                break;
        }

        this.push(file);
        return callback();
    });
};