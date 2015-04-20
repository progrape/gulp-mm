/**
 * Created by BearJ on 2015/4/5.
 */
var fs = require('fs');
var _$$Reg = "\\$([\\(\\)]{0,50})(?:.DATA)?\\$";
function _addInnerFunc(data, path) {
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
            var filePath, partName, content;
            str = str.split("#");
            filePath = str[0] ? path.substring(0, path.replace(/\\/g, "/").lastIndexOf("/") + 1) + str[0] + ".html" : path;
            str.length > 1 && (partName = str[1]);

            content = fs.readFileSync(filePath, "utf-8");
            if(partName){
                var reg = new RegExp("<%#" + partName + "%>([\\s\\S]*?)<%#/" + partName + "%>");
                content = content.match(reg);
                content = content ? content[1] : ""
            }
            return tmpl(content, data, filePath);
        },
        GetResFullName: function (str) {
            return str;
        },
        StrCmpNoCase: function (str1, str2, len) {
            return true;
        },
        GetDeviceInfo: function () {
            return 'IOS';
        },
        Left:function(str, len){
            return str.substr(0, len);
        },
        GetCurrentDate: function(){
            var date = new Date();
            return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
        }
    };
    for(var func in innerFuncs){
        if(!data[func]) data[func] = innerFuncs[func];
    }
}
function _map(key, data){
    var out = "";

    // 关键字
    if(/^if/.test(key)) out = key + "{";
    else if(/^else\s?if/.test(key)) out = "}" + key.replace("elseif", "else if") + "{";
    else if(/^else/.test(key)) out = "}" + key + "{";
    else if(/^endif/.test(key)) out = "}";
    else out = "', " + key + ", '";

    /^[^']/.test(out) && (out = "\f" + out + "\r");
    return out;
}

function _funcParse(name, args){
    var _args = [];

    if(/if/.test(name)){ // if & else if
        return name + "(" +
            args.replace(/(.*?)(\||&)(.*)/g, function (w, m1, m2, m3) { // <%@if($bear$=bear|$bear$=b)%> -> <%@if($bear$=bear||$bear$=b)%>
                return m1 + m2 + m2 + m3;
            }).replace(/([^\|&]*?)([!=><])([^\|&]*)/g, function (word, cond, equal, val) { // <%@if($bear$=bear)%> -> <%@if($bear$=='bear')%>
                return _funcArgsParse(cond) + (/[!=]/.test(equal) ? equal + "=" : equal) + _funcArgsParse(val);
            })
            + ")";
    }else{
        args = args.split(","); // StrCmpNoCase(GetDeviceInfo(TYPE),iPad,4)
        for (var i = 0, len = args.length; i < len; ++i) {
            _args.push(_funcArgsParse(args[i]));
        }
        return name + "(" + _args.join(",") + ")";
    }

}
function _funcArgsParse(arg){
    var ret = [], argArr = arg.match(/(.*?)\((.*?)\)$/); // func(...)

    if(argArr){
        ret.push(_funcParse(argArr[1], argArr[2]));
    }else{
        ret.push("'" + arg.replace(/\$(.*?)(?:.DATA)?\$/g, function(w, m1){
            return _$$Handler(m1) ? w : "' + " + w + " + '";
        }) + "'"); // <%@GetResFullName($images_path$a.jpg)%> -> <%@GetResFullName('' + $images_path$ + 'a.jpg')%>
    }

    return ret.join(",");
}

function _$$Handler(str){
    if(/\(|\)|#br#/.test(str) || str.length > 50) return true;
    return false;
}
function tmpl(str, data, path) {
    if(!str) return "";

    var fnStr = "var p=[]; with(obj){p.push('" +
        str
            .replace(/[\f\r]/g, "")
            .replace(/\n/g, "#br#")
            .replace(/<%##.*?##%>/g, "") // <%##注释##%>
            .replace(/<%#include/g, "\finclude") // <%#include(xxx)%>
            .replace(/<%#.*?<%#\/.*?%>/g, "") // <%#block%> xxx <%#/block%>
            .replace(/<%@/g, "\f")
            .replace(/%>/g, "\r")
            .replace(/'/g, "\\'")

            .replace(/\f(.*?)\((.*?)\)\r/g, function (w, m1, m2) { // <%@StrCmpNoCase(GetDeviceInfo(TYPE),iPad,4)%> -> <%@StrCmpNoCase(GetDeviceInfo('TYPE'),'iPad','4')%>
                return "\f" + _funcParse(m1, m2) + "\r";
            })
            .replace(/\f(.*?)\r/g, function(w, m1){
                return "\f" +
                    m1.replace(/\$(.*?)(?:.DATA)?\$/g, function (ww, mm1) {
                        return _$$Handler(mm1) ? ww : mm1;
                    })
                    + "\r";
            }) // <%@if($xxx$=)%> -> <%@if(xxx=)%>
            .replace(/\$(.*?)(?:.DATA)?\$/g, function(w, m1){
                return _$$Handler(m1) ? w : "', " + m1 + ", '";
            }) // <em>$xxx$</em> -> '<em>' + xxx + '</em>'
            .replace(/\f(.*?)\r/g, function(w, m1){
                return _map(m1, data);
            })

            .replace(/\f/g, "');")
            .replace(/\r/g, "p.push('")
        + "');}return p.join('');";

    //console.log("_________TO FUNC:",fnStr);
    var fn = new Function("obj", fnStr);
    _addInnerFunc(data, path);
    return data != undefined ? fn.call(data, data).replace(/#br#/g, "\n") : fn;
}
module.exports = tmpl;