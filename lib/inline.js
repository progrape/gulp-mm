/**
 * Created by jfengjiang on 2014/12/5.
 */


var path = require('path');
var fs = require('fs');
var through = require('through2');
var lodash = require('lodash');
var replace = require('async-replace');
var less = require('less');
var uglify = require('uglify-js');
var cleanCSS = require('clean-css');

var Error = require('./error');

/**
 * parse inline
 * @param content content of this file
 * @param context full file name of this
 * @param callback
 * @returns {String}
 */
function parse(content, context, callback){
    //
    var inline = /background(?:-image)?:[\s\w]*url\((["']?)([^"';]+)\?__inline["']?\)[^;]*;?|__inline\((["'])([^"']+)["']?\);?|<link[^>]+href=(["'])([^>"'\?]+)\?__inline["']?[^>]+>|<script[^>]+src=(["'])([^>"'\?]+)\?__inline["']?[^>]+><\/script>|<img[^>]+src=(["'])([^>"'\?]+)\?__inline["']?[^>]+\/>/gi;

    replace(content, inline, function(match, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, offset, source, done){

        var filename = '';

        if($2){
            filename = $2;
        }
        else if($4){
            filename = $4;
        }
        else if($6){
            filename = $6;
        }
        else if($8){
            filename = $8;
        }
        else if($10){
            filename = $10;
        }

        var abs = path.join(path.dirname(context), filename);
        if(!fs.existsSync(abs)){
            return done(null, match);
        }

        var buffer = fs.readFileSync(abs);

        var context_ext = path.extname(context);
        var extname = path.extname(abs);

        // 如果是非图片文件，则递归解析
        if(!lodash.contains(['.jpg', '.png', '.gif'], extname)){
            parse(buffer.toString('utf-8'), abs, function(err, buffer){
                switch(extname){
                    case '.css':
                        // add style tag
                        buffer = new cleanCSS().minify(buffer);
                        buffer = '<style>\n' + buffer + '\n</style>';
                        break;
                    case '.js':
                        buffer = uglify.minify(buffer, {fromString: true}).code;
                        if(context_ext === '.html'){
                            buffer = '<script>\n' + buffer + '\n</script>\n';
                        }
                        break;
                    case '.less':
                        var opts = {compress: true, paths: [path.dirname(abs)]};
                        return less.render(buffer, opts, function(error, result){
                            buffer = '<style>\n' + new cleanCSS().minify(result.css) + '\n</style>';
                            return done(null, buffer);
                        });
                        break;
                    case '.html':
                    default:
                        break;
                }
                return done(null, buffer);
            });
        }
        else{
            switch (extname){
                case '.png':
                case '.jpg':
                case '.gif':
                    buffer = match.replace('?__inline', '').replace(filename, 'data:image/png;base64,' + buffer.toString('base64'));
                    break;
                default:
                    break;
            }
            return done(null, buffer);
        }
    }, callback);
}


//// exporting the plugin
module.exports = function(){

    return through.obj(function(file, encoding, callback){

        if (file.isNull()) {
            return callback(null, file);
        }

        if(file.isStream()){
            return callback(Error('Streaming is not supported'));
        }

        var that = this;
        parse(file.contents.toString(), file.path, function(error, result){
            file.contents = new Buffer(result);
            that.push(file);
            return callback();
        });
    });
};