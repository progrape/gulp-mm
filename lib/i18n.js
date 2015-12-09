/**
 * Created by BearJ on 2015/4/19.
 */

var path = require('path');
var fs = require('fs');
var gutil = require('gulp-util');
var crypto = require('crypto');
var through = require('through2');
var PO = require('node-po-ext');
var iconv = require('iconv-lite');
var _ = require('lodash');

var translateMap = {};
var poFileCache = {};

function _md5(string){
    return crypto.createHash('md5').update(string).digest('hex');
}

/**
 * 提取出需要国际化的文本，并且替换成GetVar(md5)
 */
function _parse(file, content){
    var dirname = path.dirname(file.path), reg = /_\(\s*('|")(.*?)(\1)\s*\)/g; // _('xxx')
    content = content.replace(reg, function(word, quot, match) {
        match = match.split(new RegExp(quot + ",\\s*" + quot));
        var md5 = _md5(match[0]).substr(0, 10);
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
 */
function _setPoFile(file, content, through, opt){
    var dir = path.dirname(file.path), poDir = path.join(dir, "po"), poFiles;
    if(poFileCache[poDir]){
        poFiles = poFileCache[poDir];
    }else{
        var _poFiles = {};
        if (!fs.existsSync(poDir)){
            return content;
        }
        poFiles = fs.readdirSync(poDir);
        poFiles.forEach(function(poFileName){
            var abs = path.join(poDir, poFileName);
            if(fs.lstatSync(abs).isDirectory()) return;
            _poFiles[poFileName] = PO.parse(fs.readFileSync(abs, "utf8"));
        });
        poFiles = _poFiles;
        poFileCache[poDir] = poFiles;
    }

    var pageEncoding = content.match(/<%##encode:(.*?)##%>/); // 页面需要的编码
    pageEncoding = pageEncoding && pageEncoding.length > 1 ? pageEncoding[1].replace(/-/g, "") : opt.encoding;
    var langPrefix = [
            "<%@if($lang$=)%>",
            "   <%@if($wechat_real_lang$=zh_CN)%>", // wechat_real_lang是support后台特意加到页面的默认语言
            "       <%#include(lang_zh_CN)%>",
            "   <%@else if($wechat_real_lang$=zh_HK)%>",
            "       <%#include(lang_zh_HK)%>",
            "   <%@else if($wechat_real_lang$=zh_TW)%>",
            "       <%#include(lang_zh_TW)%>",
            "   <%@else%>",
            "       <%#include(lang_en_US)%>",
            "   <%@endif%>",
            "<%@else%>",
            "   <%@if($lang$=zh_CN)%>",
            "       <%#include(lang_zh_CN)%>",
            "   <%@else if($lang$=zh_HK)%>",
            "       <%#include(lang_zh_HK)%>",
            "   <%@else if($lang$=zh_TW)%>",
            "       <%#include(lang_zh_TW)%>",
            "   <%@else%>",
            "       <%#include(lang_en_US)%>",
            "   <%@endif%>",
            "<%@endif%>"
        ].join("\n") + "\n";
    for(var poFileName in poFiles){
        var poFileBase = path.basename(poFileName, ".po"), poFilePath = path.join(poDir, poFileName), langContent = "";
        var po = poFiles[poFileName];

        for (var i = 0, len = po.items.length; i < len; i++) {
            var poItem = po.items[i], translateItem;
            if (translateMap[dir]) {
                translateItem = translateMap[dir][poItem.comments[0]];
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
                po_content += '#: ' + item.replace(/\\/g, "/") + '\n';
            });
            po_content += 'msgid "' + item.msgid[0] + '"\n';
            po_content += 'msgstr "' + (item.msgstr || '') + '"\n';
            po_content += '\n\n';

            var langVal = (item.msgstr || item.msgid[0]).replace(/\(/g,"&#40;").replace(/\)/g,"&#41;").replace(/,/g,"&#44;").replace(/'/g,"&#39;").replace(/"/g,"&quot;");
            if(item.msgid.length > 1){
                for (i = 1, len = item.msgid.length; i < len; ++i) { // 实现无序替换 _("%sBear%s","<a href='javascript:'>","</a>")
                    langVal = langVal.replace(/%s/, item.msgid[i]);
                }
                for (i = 1, len = item.msgid.length; i < len; ++i) { // 实现有序替换 _("从%1拿了%2元钱","Bear","20")
                    langVal = langVal.replace("%" + i, item.msgid[i]);
                }
            }
            langContent += "<%@SetVar(" + item.comment + "," + langVal + ")%>\n";
        }


        fs.writeFileSync(poFilePath, po_content); // 存入po文件
        through.push(new gutil.File({ // 生成lang_xxx.hgml文件
            cwd: file.cwd,
            base: file.base,
            path: path.join(path.dirname(file.path), "lang_" + poFileBase + ".html"),
            contents: new Buffer(langContent)
        }));


        switch (poFileBase) {
            case "zh_CN":
            case "zh_HK":
            case "zh_TW":
            case "en_US":
                break;
            default:
                langPrefix += "<%@if($wechat_real_lang$=" + poFileBase + "|$lang$=" + poFileBase + ")%><%#include(lang_" + poFileBase + ")%><%@endif%>\n";
        }
        if(pageEncoding != opt.encoding){
            // 如果页面编码和项目编码不一致，则直接把当前已存在的po塞到页面里面
            langPrefix = langPrefix.replace(new RegExp("<%#include\\(lang_" + poFileBase + "\\)%>", "g"), langContent);
            content = content.replace(new RegExp("<%#include\\(lang_" + poFileBase + "\\)%>", "g"), langContent);
        }
    }

    if(pageEncoding != opt.encoding){
        // 如果页面编码和项目编码不一致，则直接把当前已存在的po塞到页面里面
        content = langPrefix + content;
    }else{
        var insertTag = "<html", insertPos = content.indexOf(insertTag);
        // 插在<html前面
        // 这样做的目的是有些页面是用include一个模板的，而模板本身已经加载了语言文件，所以这些片段无需再加载
        if (insertPos > -1) {
            content = content.substr(0, insertPos) + langPrefix + content.substr(insertPos);
        }
    }
    return content;
}

module.exports = function (opt) {
    opt = _.extend({
        encoding: 'utf8' // opt 传入整个大src的默认编码
    }, opt);
    opt.encoding = opt.encoding.replace(/-/g, "");

    return through.obj(function(file, encoding, callback){
        if (file.isNull()) {
            return callback(null, file);
        }

        if(file.isStream()){
            return callback(Error('Streaming is not supported'));
        }

        var content = file.contents.toString();
        // 1. get _("xxx")
        content = _parse(file, content);

        // 2. setPoFile
        content = _setPoFile(file, content, this, opt);

        file.contents = new Buffer(content);

        this.push(file);
        return callback();
    });
};