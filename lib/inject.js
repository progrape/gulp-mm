/**
 * Created by jfengjiang on 2014/12/9.
 */
var through = require('through2');

module.exports = function(){

    return through.obj(function(file, encoding, callback){

        if (file.isNull()) {
            return callback(null, file);
        }

        if(file.isStream()){
            return callback(Error('Streaming is not supported'));
        }

        this.push(file);
        return callback();
    });
};