/**
 * Created by jfengjiang on 2014/12/5.
 */

var fs = require('fs');
var path = require('path');
var lodash = require('lodash');
var gutil = require('gulp-util');
var http = require('http');
var socket = require('socket.io');
var parseurl = require('parseurl');

/**
 * _sockets
 * @type {Array}
 */
var _sockets = [];

/**
 * handler
 * @param {Object} opts
 * @returns {Function}
 */
function handler(opts){

    var MINE = { '.bmp': 'image/bmp', '.css': 'text/css', '.doc': 'application/msword', '.dtd': 'text/xml', '.gif': 'image/gif', '.hta': 'application/hta', '.htc': 'text/x-component', '.htm': 'text/html', '.html': 'text/html', '.xhtml' : 'text/html', '.ico': 'image/x-icon', '.jpe': 'image/jpeg', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.js': 'text/javascript', '.json': 'application/json', '.mocha' : 'text/javascript', '.mp3': 'audio/mp3', '.mp4': 'video/mpeg4', '.mpeg': 'video/mpg', '.mpg': 'video/mpg', '.manifest' : 'text/cache-manifest', '.pdf': 'application/pdf', '.png': 'image/png', '.ppt': 'application/vnd.ms-powerpoint', '.rmvb': 'application/vnd.rn-realmedia-vbr', '.rm': 'application/vnd.rn-realmedia', '.rtf': 'application/msword', '.svg': 'image/svg+xml', '.swf': 'application/x-shockwave-flash', '.tif': 'image/tiff', '.tiff': 'image/tiff', '.txt': 'text/plain', '.vml': 'text/xml', '.vxml': 'text/xml', '.wav': 'audio/wav', '.wma': 'audio/x-ms-wma', '.wmv': 'video/x-ms-wmv', '.woff': 'image/woff', '.xml': 'text/xml', '.xls': 'application/vnd.ms-excel', '.xq': 'text/xml', '.xql': 'text/xml', '.xquery' : 'text/xml', '.xsd': 'text/xml', '.xsl': 'text/xml', '.xslt': 'text/xml'};
    var socketjs = fs.readFileSync(__dirname + '/socket.io-1.3.4.js', 'utf-8');

    return function(req, res){
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            res.statusCode = 404;
            return res.end('not found');
        }

        var pathname = parseurl(req).pathname;
        if(pathname.charAt(pathname.length - 1) === '/'){
            pathname += 'index.html';
        }else if(path.extname(pathname).length < 2){
            pathname += '/index.html';
        }


        var abs = path.join(opts.root, pathname);
        if(!fs.existsSync(abs)){
            res.statusCode = 404;
            return res.end('file: ' + pathname + ' not found');
        }

        var extname = path.extname(abs);
        var mine = MINE[extname] ? MINE[extname] : 'text/plain';
        if(mine.indexOf('text') !== -1) mine += '; charset=utf-8';

        res.writeHead(200, {
            'Content-Type': mine,
            'Server': 'node',
            'X-Powered-By': 'gulp-mm-server'
        });

        if (opts.live && mine.indexOf('text/html') !== -1){
            var replacement = '<script>{{socketjs}}</script>\n' +
                '<script>\n' +
                'var socket = io();\n' +
                ' socket.on("change", function(data){\n' +
                'window.location.reload();\n' +
                '});\n' +
                '</script>\n' +
                '</body>\n';
            replacement = replacement.replace('{{socketjs}}', socketjs);
            fs.readFile(abs, 'utf-8', function (error, content) {
                content = content.replace(/<\/body>/gi, replacement);
                return res.end(content);
            });
        }else{
            return fs.createReadStream(abs).pipe(res);
        }
    }
}

/**
 * start server
 * @param {Object} options default: {port: 8080}
 */
function start(options){
    var opts = lodash.extend({port: 8080, root: __dirname, live: true}, options);
    var app = http.createServer(handler(opts));
    var io = socket(app);

    app.listen(opts.port, function(){
        var url = 'http://127.0.0.1' + (opts.port == 80 ? '' : ':' + opts.port);
        console.log('[' + gutil.colors.green('server') + '] start on %s', url);
    });

    // listen with socket
    io.on('connection', function(socket){
        _sockets.push(socket);

        socket.on('disconnect', function(){
            var index = _sockets.indexOf(socket);
            if(index != -1){
                _sockets.splice(index, 1);
            }
        });
    });
}

/**
 * emit socket event
 * @param event
 * @param data
 */
function emit(event, data){
    _sockets.forEach(function(socket){
        if(socket) socket.emit(event, data);
    });
}

module.exports = start;
module.exports.start = start;
module.exports.emit = emit;