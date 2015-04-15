/**
 * Created by jfengjiang on 2015/4/15.
 */

var path = require('path');
var through = require('through2');
var iconv = require("iconv-lite");

module.exports = function(encode){
    return through.obj(function(file, encoding, callback){
        var content = file.contents.toString();
        file.contents = new Buffer(iconv.encode(content, encode));
        this.push(file);
        return callback();
    });
};