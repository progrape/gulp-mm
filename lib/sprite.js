/**
 * Created by jfengjiang on 12/15/14.
 */

var path = require('path');
var fs = require('fs');
var gutil = require('gulp-util');
var through = require('through2');
var Image = require('node-images');
var lodash = require('lodash');
var pack = require('bin-pack');

var Error = require('./error');

module.exports = function (opt) {
    var regex = /background(?:-image)?:[\s\w]*url\((["']?)([^"';]+)\?__sprite\1\)[^;]*;?/g;
    opt = lodash.extend({margin: 0, preprocessor: 'less', rootPath: '', prefix: ''}, opt);

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
                // 图片的绝对路径
                var abs = path.join(path.dirname(file.path), $2);
                if(!fs.existsSync(abs)){
                    abs = path.join(opt.rootPath, $2);
                }
                // 如果图片不存在，pass
                if(!fs.existsSync(abs)){
                    return matcher;
                }

                // 如果图片名含有@2x，就是二倍图
                var retina = lodash.contains(abs, '@2x') ? '2x' : '1x';
                var sprite;

                // 如果图片已经存在过了，就不要重复合并
                var index = lodash.findIndex(sprites[retina], {abs: abs});
                if(index !== -1){
                    sprite = sprites[retina][index];
                }else{
                    var img = Image(abs);
                    sprite = {
                        'abs': abs,
                        'img': img,
                        'width': img.width() + opt.margin,
                        'height': img.height() + opt.margin
                    };
                    sprites[retina].push(sprite);
                }

                var x = retina + abs + '--x--';
                var y = retina + abs + '--y--';
                var bs = retina === '2x' ? '-webkit-background-size: $bsx_' + retina + '$px $bsy_' + retina + '$px;background-size: $bsx_' + retina + '$px $bsy_' + retina + '$px;' : '';
                return 'background: transparent url("' + path.basename(filename[retina]) + '") no-repeat ' + x + 'px ' + y + 'px;' + bs;
            });

            var that = this;

            lodash.forEach(sprites, function (sprite, retina) {
                if (sprite.length < 1){
                    return;
                }

                // 排序
                var result = pack(sprite);
                var canvas = Image(result.width, result.height);
                lodash(result.items).forEach(function (s) {
                    canvas.draw(s.item.img, s.x, s.y);
                    content = content.replace(retina + s.item.abs + '--x--', retina === '2x' ? -s.x / 2 : -s.x);
                    content = content.replace(retina + s.item.abs + '--y--', retina === '2x' ? -s.y / 2 : -s.y);
                });

                // 把sprite文件输出
                that.push(new gutil.File({
                    cwd: file.cwd,
                    base: file.base,
                    path: filename[retina],
                    contents: canvas.encode('png')
                }));
                var bsx = retina === '2x' ? result.width / 2 : result.width;
                var bsy = retina === '2x' ? result.height / 2 : result.height;
                var regexX = new RegExp('\\$bsx_' + retina + '\\$', 'g');
                var regexY = new RegExp('\\$bsy_' + retina + '\\$', 'g');
                content = content.replace(regexX, bsx).replace(regexY, bsy);
            });

            file.contents = new Buffer(content);
        }

        this.push(file);
        return callback();
    });
};