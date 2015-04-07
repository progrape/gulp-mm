/**
 * Created by BearJ on 2015/4/5.
 */
var fs = require('fs');

var _path, _data;
function _addInnerFunc(data) {
    var innerFuncs = {
        EasyEncode: function (str) {
            if (!str.length) return "";
            str = str.replace(/&/g, "&gt;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/ /g, "&nbsp;")
                .replace(/'/g, "&#39;")
                .replace(/"/g, "&quot;")
                .replace(/\n/g, "<br>");
            return str;
        },
        SetVar: function(key, val){
            this["var" + key] = val;
            return "";
        },
        GetVar: function(key){
            return this["var" + key];
        },
        include: function(str){
            var fileName, partName, content;
            str = str.split("#");
            fileName = str[0];
            str.length > 1 && (partName = str[1]);

            content = fs.readFileSync(_path + fileName + ".html", "utf-8");
            if(partName){
                var reg = new RegExp("<%#" + partName + "%>([\\s\\S]*?)<%#/" + partName + "%>");
                content = content.match(reg)[1];
            }
            return tmpl(content);
        },
        GetResFullName: function (str) {
            return '';
        },
        StrCmpNoCase: function (str1, str2, len) {
            return true;
        },
        GetDeviceInfo: function () {
            return 'IOS';
        }
    };
    for(var func in innerFuncs){
        data[func] = innerFuncs[func];
    }
}
function _map(key, data){
    var out = "";

    // 关键字
    if(/^if/.test(key)) out = key + "{";
    else if(/^else\s?if/.test(key)) out = "}" + key.replace("elseif", "else if") + "{";
    else if(/^else/.test(key)) out = "}" + key + "{";
    else if(/^endif/.test(key)) out = "}";
    else if(/^each/.test(key)){
        var command = key.match(/each\s?\((.*?)\sas\s(.*?)\s(.*)\)/), // each (xxx as k v)
            objName = command[1], kName = command[2], vName = command[3];
        with(data){
            out = "for(" + kName + " in " + objName + "){var " + vName + " = " + objName + "[" + kName + "];";
        }
    }
    else if(/^break/.test(key)) out = "break;";
    else if(/^continue/.test(key)) out = "continue;";
    else out = "', " + key + ", '";

    /^[^']/.test(out) && (out = "\t" + out + "\r");
    return out;
}

function tmpl(str, data, path) {
    data && (_data = data);
    path && (_path = path);
    if(!/<%[@#]/.test(str)) return str;

    var fnStr = "var p=[]; with(obj){p.push('" +
        str
            .replace(/[\r\t\n]/g, " ")
            .replace(/<%[@#]/g, "\t")
            .replace(/%>/g, "\r")

            .replace(/'/g, "\\'")
            .replace(/(\t.*?)(Var|include|GetResFullName|GetDeviceInfo|StrCmpNoCase)\((.*?)\)(.*?\r)/g, function (word, match1, match2, match3, match4) { // <%@func(var1, var'2)%> -> func('var1', 'var\'2')
                return match1 + match2 + "('" + match3.split(",").join("','") + "')"+ match4;
            })
            .replace(/(\t.*?)(!|=)([^\)]*)(.*?\r)/g, "$1$2='$3'$4") // <%@if($bear$=bear)%> -> <%@if($bear$=='bear')%>
            .replace(/(\r.*?)\$(.*?)(?:.DATA)?\$(.*?\t)/g, "$1', $2, '$3") // 非模板语言中的$xxx$
            .replace(/\$(.*?)(?:.DATA)?\$/g, "$1") // 模板语言中其他的$xxx$
            .replace(/\t(.*?)\r/g, function(word, match){
                return _map(match, data);
            })

            .replace(/\t/g, "');")
            .replace(/\r/g, "p.push('")
        + "');}return p.join('');";

    var fn = new Function("obj", fnStr);
    _addInnerFunc(_data);
    //console.log(str,"_________TO FUNC:",fnStr);
    return _data != undefined ? fn.call(_data, _data) : fn;
}
module.exports = tmpl;/**
 * Created by BearJ on 2015/4/5.
 */
var fs = require('fs');

var _path, _data;
function _addInnerFunc(data) {
    var innerFuncs = {
        EasyEncode: function (str) {
            if (!str.length) return "";
            str = str.replace(/&/g, "&gt;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/ /g, "&nbsp;")
                .replace(/'/g, "&#39;")
                .replace(/"/g, "&quot;")
                .replace(/\n/g, "<br>");
            return str;
        },
        SetVar: function(key, val){
            this["var" + key] = val;
            return "";
        },
        GetVar: function(key){
            return this["var" + key];
        },
        include: function(str){
            var fileName, partName, content;
            str = str.split("#");
            fileName = str[0];
            str.length > 1 && (partName = str[1]);

            content = fs.readFileSync(_path + fileName + ".html", "utf-8");
            if(partName){
                var reg = new RegExp("<%#" + partName + "%>([\\s\\S]*?)<%#/" + partName + "%>");
                content = content.match(reg)[1];
            }
            return tmpl(content);
        },
        GetResFullName: function (str) {
            return '';
        },
        StrCmpNoCase: function (str1, str2, len) {
            return true;
        },
        GetDeviceInfo: function () {
            return 'IOS';
        }
    };
    for(var func in innerFuncs){
        data[func] = innerFuncs[func];
    }
}
function _map(key, data){
    var out = "";

    // 关键字
    if(/^if/.test(key)) out = key + "{";
    else if(/^else\s?if/.test(key)) out = "}" + key.replace("elseif", "else if") + "{";
    else if(/^else/.test(key)) out = "}" + key + "{";
    else if(/^endif/.test(key)) out = "}";
    else if(/^each/.test(key)){
        var command = key.match(/each\s?\((.*?)\sas\s(.*?)\s(.*)\)/), // each (xxx as k v)
            objName = command[1], kName = command[2], vName = command[3];
        with(data){
            out = "for(" + kName + " in " + objName + "){var " + vName + " = " + objName + "[" + kName + "];";
        }
    }
    else if(/^break/.test(key)) out = "break;";
    else if(/^continue/.test(key)) out = "continue;";
    else out = "', " + key + ", '";

    /^[^']/.test(out) && (out = "\t" + out + "\r");
    return out;
}

function tmpl(str, data, path) {
    data && (_data = data);
    path && (_path = path);
    if(!/<%[@#]/.test(str)) return str;

    var fnStr = "var p=[]; with(obj){p.push('" +
        str
            .replace(/[\r\t\n]/g, " ")
            .replace(/<%[@#]/g, "\t")
            .replace(/%>/g, "\r")

            .replace(/'/g, "\\'")
            .replace(/(\t.*?)(Var|include|GetResFullName|GetDeviceInfo|StrCmpNoCase)\((.*?)\)(.*?\r)/g, function (word, match1, match2, match3, match4) { // <%@func(var1, var'2)%> -> func('var1', 'var\'2')
                return match1 + match2 + "('" + match3.split(",").join("','") + "')"+ match4;
            })
            .replace(/(\t.*?)(!|=)([^\)]*)(.*?\r)/g, "$1$2='$3'$4") // <%@if($bear$=bear)%> -> <%@if($bear$=='bear')%>
            .replace(/(\r.*?)\$(.*?)(?:.DATA)?\$(.*?\t)/g, "$1', $2, '$3") // 非模板语言中的$xxx$
            .replace(/\$(.*?)(?:.DATA)?\$/g, "$1") // 模板语言中其他的$xxx$
            .replace(/\t(.*?)\r/g, function(word, match){
                return _map(match, data);
            })

            .replace(/\t/g, "');")
            .replace(/\r/g, "p.push('")
        + "');}return p.join('');";

    var fn = new Function("obj", fnStr);
    _addInnerFunc(_data);
    //console.log(str,"_________TO FUNC:",fnStr);
    return _data != undefined ? fn.call(_data, _data) : fn;
}
module.exports = tmpl;