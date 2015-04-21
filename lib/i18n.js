/**
 * Created by BearJ on 2015/4/19.
 */

var path = require('path');
var fs = require('fs');
var crypto = require('crypto');
var through = require('through2');
var PO = require('node-po-ext');
var iconv = require('iconv-lite');

var translateMap = {};
var poFileCache = {};
var dest = "./dist";
var enc = "utf-8";

/**
 * to md5
 * @param string
 * @returns {*}
 * @private
 */
function _md5(string){
    return crypto.createHash('md5').update(string).digest('hex');
}

/**
 * 提取出需要国际化的文本，并且替换成GetVar(md5)
 * @param file
 * @param content
 * @returns {*|XML|string|void}
 * @private
 */
function _parse(file, content){
    var dirname = path.dirname(file.path), reg = /_\(\s*('|")(.*?)(\1)\s*\)/g; // _('xxx')
    content = content.replace(reg, function(word, quot, match) {
        var md5 = _md5(match).substr(0, 6);
        var out = "<%@GetVar(" + md5 + ")%>";
        word = out;
        if(!translateMap[dirname]){
            translateMap[dirname] = {};
        }
        translateMap[dirname][md5] = {
            msgid : match,
            comment : md5,
            references : [file.relative]
        };
        return word;
    });
    return content;
}

/**
 * 保存po文件
 * @param file
 * @param content
 * @returns {*}
 * @private
 */
function _setPoFile(file, content){
    var dir = path.dirname(file.path), poDir = path.join(dir, "po"), poFiles;
    if(poFileCache[poDir]){
        poFiles = poFileCache[poDir];
    }else{
        var _poFiles = {};
        if (!fs.existsSync(poDir)){
            fs.mkdirSync(poDir);
        }
        poFiles = fs.readdirSync(poDir);
        poFiles.forEach(function(poFileName){
            var abs = path.join(poDir, poFileName);
            if(fs.lstatSync(abs).isDirectory()){
                return;
            }
            _poFiles[poFileName] = PO.parse(fs.readFileSync(path.join(poDir, poFileName), "utf-8"));
        });
        poFiles = _poFiles;
        poFileCache[poDir] = poFiles;
    }

    for(var poFileName in poFiles){
        var poFileBase = path.basename(poFileName, ".po"), poFilePath = path.join(poDir, poFileName), langContent = "";
        var po = poFiles[poFileName];

        for (var i = 0, len = po.items.length; i < len; i++) {
            var poItem = po.items[i], translateItem;
            if (translateMap[dir]) {
                translateItem = translateMap[dir][poItem.comments[0]];
            } else {
                console.log('translateMap error' + dir);
            }
            if (translateItem) {
                translateItem.msgstr = poItem.msgstr[0];
            }
        }

        var po_content = [
            'msgid ""',
            'msgstr ""',
            '"Plural-Forms: nplurals=1; plural=0;\\n"',
            '"Project-Id-Version: fis\\n"',
            '"POT-Creation-Date: \\n"',
            '"PO-Revision-Date: \\n"',
            '"Last-Translator: \\n"',
            '"Language-Team: \\n"',
            '"MIME-Version: 1.0\\n"',
            '"Content-Type: text/plain; charset=UTF-8\\n"',
            '"Content-Transfer-Encoding: 8bit\\n"',
            '"Language: zh_CN\\n"',
            '"X-Generator: fis xgettext2 \\n"',
            '"X-Poedit-SourceCharset: UTF-8\\n"',
            '', '', ''
        ].join('\n');
        for (var key in translateMap[dir]) {
            var item = translateMap[dir][key];

            po_content += '# ' + item.comment + '\n';
            item.references.forEach(function (item) {
                po_content += '#: ' + item + '\n';
            });
            po_content += 'msgid "' + item.msgid + '"\n';
            po_content += 'msgstr "' + (item.msgstr || '') + '"\n';
            po_content += '\n\n';

            langContent += "<%@SetVar(" + item.comment + "," + (item.msgstr || item.msgid).replace('(','&#40;').replace(')','&#41;').replace(',','&#44;').replace('\'','&#39;') + ")%>\n";
        }

        fs.writeFile(poFilePath, po_content, function (err) {});
        langContent = iconv.encode(langContent, enc);
        fs.writeFile(path.join(path.dirname(path.join(file.cwd, dest, file.relative)).replace(/tmpl$/gi, ''), "lang_" + poFileBase + ".html"), langContent, function () {});

        var prefix;
        switch(poFileBase){
            case "zh_CN": prefix = "<%@if($lang$=zh_CN|$lang$=)%>";break;
            case "en_US": prefix = "<%@if($lang$=en|$lang$=en_US)%>";break;
            default: prefix = "<%@if($lang$=" + poFileBase + ")%>";
        }
        content = prefix + "<%#include(lang_" + poFileBase + ")%><%@endif%>\n" + content;
    }
    return content;
}

module.exports = function (opt) {
    return through.obj(function(file, encoding, callback){
        if (file.isNull()) {
            return callback(null, file);
        }

        if(file.isStream()){
            return callback(Error('Streaming is not supported'));
        }

        if(opt.dest) dest = opt.dest;
        if (opt.encoding) enc = opt.encoding;

        var content = file.contents.toString();
        // 1. get _("xxx")
        content = _parse(file, content);

        // 2. setPoFile
        content = _setPoFile(file, content);

        file.contents = new Buffer(content);

        this.push(file);
        return callback();
    });
};