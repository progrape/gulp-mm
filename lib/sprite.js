/**
 * Created by jfengjiang on 12/15/14.
 */

var path = require('path');
var fs = require('fs');
var gutil = require('gulp-util');
var through = require('through2');
var Image = require('node-images');
var lodash = require('lodash');

var Error = require('./error');

module.exports = function (opt) {
    var regex = /background(?:-image)?:[\s\w]*url\((["']?)([^"';]+)\?__sprite\1\)[^;]*;?/g;
    opt = lodash.extend({margin: 0, preprocessor: 'less', rootPath: '', prefix: '', orientation: 'vertical'}, opt);

    return through.obj(function(file, encoding, callback){

        if (file.isNull()) {
            return callback(null, file);
        }

        if(file.isStream()){
            return callback(Error('Streaming is not supported'));
        }

        if(regex.test(file.contents.toString())){
            // store image fragment {img: new Buffer(), x: 0, y: 0}
            var sprites = {'1x': [], '2x': []};
            // output sprite image width
            var ctxWidth = {'1x': 0, '2x': 0};
            // output sprite image height
            var ctxHeight = {'1x': 0, '2x': 0};
            // output sprite image filename
            var filename = {
                '1x': path.join(path.dirname(file.path), path.basename(file.path, '.css') + '_z.png'),
                '2x': path.join(path.dirname(file.path), path.basename(file.path, '.css') + '_z@2x.png')
            };

            var content = file.contents.toString();
            content = content.replace(regex, function(matcher, $1, $2){
                var abs = path.join(path.dirname(file.path), $2);
                if(!fs.existsSync(abs)){
                    abs = path.join(opt.rootPath, $2);
                }
                var retina = lodash.contains(abs, '@2x') ? '2x' : '1x';
                var sprite;

                if(!fs.existsSync(abs)){
                    return matcher;
                }

                // if image fragment exist
                var index = lodash.findIndex(sprites[retina], {abs: abs});
                if(index !== -1){
                    sprite = sprites[retina][index];
                }else{
                    //TODO if file not exist
                    var img = Image(abs);
                    sprite = {
                        'abs': abs,
                        'img': img,
                        'x': opt.orientation === 'vertical' ? opt.margin : ctxWidth[retina] + opt.margin,
                        'y': opt.orientation === 'vertical' ? ctxHeight[retina] + opt.margin: opt.margin
                    };
                    sprites[retina].push(sprite);

                    if (opt.orientation === 'vertical') {
                        ctxHeight[retina] = ctxHeight[retina] + img.height() + 2 * opt.margin;
                        if (img.width() + 2 * opt.margin > ctxWidth[retina]) {
                            ctxWidth[retina] = img.width() + 2 * opt.margin;
                        }
                    }
                    else {
                        ctxWidth[retina] = ctxWidth[retina] + img.width() + 2 * opt.margin;
                        if (img.height() + 2 * opt.margin > ctxHeight[retina]) {
                            ctxHeight[retina] = img.height() + 2 * opt.margin;
                        }
                    }
                }

                var x = retina === '2x' ? -sprite.x /2 : -sprite.x;
                var y = retina === '2x' ? -sprite.y / 2: -sprite.y;
                var bs = retina === '2x' ? '-webkit-background-size: $bsx_' + retina + '$px $bsy_' + retina + '$px;background-size: $bsx_' + retina + '$px $bsy_' + retina + '$px;' : '';
                return 'background: transparent url("' + path.basename(filename[retina]) + '") no-repeat ' + x + 'px ' + y + 'px;' + bs;
            });

            var that = this;
            lodash.forEach(sprites, function(sprite, ratina){
                if(sprite.length < 1){
                    return;
                }

                var canvas = Image(ctxWidth[ratina], ctxHeight[ratina]);
                lodash(sprite).forEach(function(s){
                    canvas.draw(s.img, s.x, s.y);
                });
                // 把sprite文件输出
                that.push(new gutil.File({
                    cwd: file.cwd,
                    base: file.base,
                    path: filename[ratina],
                    contents: canvas.encode('png')
                }));
                var bsx = ratina === '2x' ? ctxWidth[ratina] / 2 : ctxWidth[ratina];
                var bsy = ratina === '2x' ? ctxHeight[ratina] / 2 : ctxHeight[ratina];
                var regexX = new RegExp('\\$bsx_' + ratina + '\\$', 'g');
                var regexY = new RegExp('\\$bsy_' + ratina + '\\$', 'g');
                content = content.replace(regexX, bsx).replace(regexY, bsy);
            });

            file.contents = new Buffer(content);
        }

        this.push(file);
        return callback();
    });
};