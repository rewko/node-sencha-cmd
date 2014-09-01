var sencha = require('../lib/runner');

var cmd = 'd:/apps/Sencha/Cmd/5.0.0.160';

function done() {
    console.log('done ...');
}

sencha.cmd(cmd, 'which').run().on('end', done);

var params = [
    '-cl /src,../../../../Dashboard,../../../../Prototype',
    '--ignore node_modules,single.ext.js',
    'union -r -c Dashboard.view.widget.popup.MessageDialogWindow',
    'and include -r -cl Dashboard.view.widget.popup.DataDialogWindow',
    'and exclude -r -cl Infor.app.Application',
    'and concat -yui -out /single.ext.min.js',
    'and exclude -na Ext and exclude -tag core',
    'and meta -file -out requires.txt -tpl {0}',
    'and concat -out /single.ext.js'
];

var compile = sencha.cmd(cmd, 'compile').option('-cl', '/src,../../../../Dashboard,../../../../Prototype').union('-r', '-c Dashboard.view.widget.popup.MessageDialogWindow').include('-r', '-cl Dashboard.view.widget.popup.DataDialogWindow').meta('requires.txt').option('--tpl', '{0}').option('--filenames').concatenate('single.ext.js');

console.log(compile.toString());
