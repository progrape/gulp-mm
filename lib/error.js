/**
 * Created by jfengjiang on 2014/12/5.
 */

var PluginError = require('gulp-util/lib/PluginError');

module.exports = function() {
    var Factory = PluginError.bind.apply(PluginError, [].concat(null, 'gulp-code', Array.prototype.slice.call(arguments)));
    return new Factory();
};