/// <reference path="../node.d.ts" />
var sencha = require('../lib/runner');
var cmd = 'd:/apps/Sencha/Cmd/5.0.0.160';
function done() {
    console.log('done ...');
}
// which
sencha.cmd(cmd, 'which').run().on('data', function (msg) {
    console.log(msg);
}).on('end', done);
// compile
var compile = sencha.cmd(cmd, 'compile').option('-cl', '/src,../../../../Dashboard,../../../../Prototype').union('-r', '-c Dashboard.view.widget.popup.MessageDialogWindow').include('-r', '-cl Dashboard.view.widget.popup.DataDialogWindow').meta('requires.txt').option('--tpl', '{0}').option('--filenames').concatenate('single.ext.js');
console.log(compile.toString());
// app build
console.log(sencha.cmd(cmd, 'app build').toString());
