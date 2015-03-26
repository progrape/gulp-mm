/**
 * Created by jfengjiang on 12/14/14.
 */

var path = require('path');
var fs = require('fs');
var through = require('through2');

module.exports = function(){

    var socket_io = fs.readFileSync(__dirname + '/socket.io-1.3.4.js', 'utf-8');
    return through.obj(function(file, encoding, callback){

        if (file.isNull()) {
            return callback(null, file);
        }

        if(file.isStream()){
            return callback(Error('Streaming is not supported'));
        }

        var html = '<script>{{socket_io}}</script>\n' +
                    '<script>\n' +
                        'var socket = io("/");\n' +
                        ' socket.on("change", function(data){\n' +
                        'window.location.reload();\n' +
                        '});\n' +
                    '</script>\n' +
                    '</body>\n';
        html = html.replace('{{socket_io}}', socket_io);

        if(path.extname(file.path) === '.html'){
            file.contents = new Buffer(file.contents.toString().replace(/<\/body>/gi, html))
        }
        this.push(file);
        return callback();
    });
};