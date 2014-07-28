/*
* sencha-cmd
* https://github.com/rewko/sencha-cmd
*
* Copyright (c) 2014 rewko
* Licensed under the MIT license.
*/

var Runner = require('./lib/runner');

module.exports = function init(sencha) {
    return Runner.cmd.bind(null, sencha);
};
