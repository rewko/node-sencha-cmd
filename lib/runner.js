var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var cp = require('child_process');
var path = require('path');

var log;
(function (_log) {
    var Level;
    (function (Level) {
        Level[Level["debug"] = 0] = "debug";
        Level[Level["warning"] = 1] = "warning";
        Level[Level["error"] = 2] = "error";
    })(Level || (Level = {}));

    function writeln() {
        console.log('\n');
    }
    _log.writeln = writeln;

    function error(msg) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        log(2 /* error */, msg, args);
    }
    _log.error = error;

    function debug(msg) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        log(0 /* debug */, msg, args);
    }
    _log.debug = debug;

    function warn(msg) {
        var args = [];
        for (var _i = 0; _i < (arguments.length - 1); _i++) {
            args[_i] = arguments[_i + 1];
        }
        log(1 /* warning */, msg, args);
    }
    _log.warn = warn;

    function log(level, msg, args) {
        if (args && args.length > 0) {
            console.log.apply(null, [].concat(msg, args));
        } else {
            console.log(msg);
        }
    }
})(log || (log = {}));

exports.cmd = function (sencha, cmd) {
    switch (cmd) {
        case 'compile':
            return new Commands.CompileCommand(sencha);
        case 'which':
            return new Commands.WhichCommand(sencha);
        default:
            return new Commands.Command(sencha, cmd);
    }
};

(function (Commands) {
    var Command = (function () {
        function Command(sencha, cmd) {
            if (typeof cmd === "undefined") { cmd = ''; }
            this.sencha = sencha;
            this.cmd = [cmd];
        }
        Command.prototype.append = function () {
            var args = Array.prototype.slice.call(arguments), cmd = args.shift(), options = args.shift();

            if (typeof cmd === 'string') {
                this.cmd.push(cmd);
            } else if (Array.isArray(cmd)) {
                this.cmd = this.cmd.concat(cmd);
            }

            if (options) {
                this.append(options);
            }

            if (args.length > 0) {
                this.cmd = this.cmd.concat(args);
            }
        };

        Command.prototype.run = function (done) {
            var cmd = path.join(path.normalize(this.sencha), 'sencha');

            Runner.runScript([cmd, this.toString()].join(' '), function () {
                done();
            });
        };

        Command.prototype.toString = function () {
            return this.cmd.join(' ');
        };
        return Command;
    })();
    Commands.Command = Command;

    var WhichCommand = (function (_super) {
        __extends(WhichCommand, _super);
        function WhichCommand(sencha) {
            _super.call(this, sencha, 'which');
        }
        return WhichCommand;
    })(Command);
    Commands.WhichCommand = WhichCommand;

    var CompileCommand = (function (_super) {
        __extends(CompileCommand, _super);
        function CompileCommand(sencha) {
            _super.call(this, sencha, 'compile');

            this.a = '';
        }
        CompileCommand.prototype.option = function (name, value) {
            if (name.search(/^-.*/gi) === -1) {
                name = '-' + name;
            }

            this.append(name, value || '');

            return this;
        };

        CompileCommand.prototype.and = function () {
            var and = this.a;

            this.a = 'and ';

            return and;
        };

        CompileCommand.prototype.union = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            this.append(this.and() + 'union', args);

            return this;
        };

        CompileCommand.prototype.include = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            this.append(this.and() + 'include', args);

            return this;
        };

        CompileCommand.prototype.exclude = function () {
            var args = [];
            for (var _i = 0; _i < (arguments.length - 0); _i++) {
                args[_i] = arguments[_i + 0];
            }
            this.append(this.and() + 'exclude', args);

            return this;
        };

        CompileCommand.prototype.meta = function (output) {
            this.append(this.and() + 'meta');

            if (output) {
                this.option('output-file', output);
            }

            return this;
        };

        CompileCommand.prototype.concatenate = function (output) {
            this.append(this.and() + 'concatenate');

            if (output) {
                this.option('output-file', output);
            }

            return this;
        };
        return CompileCommand;
    })(Command);
    Commands.CompileCommand = CompileCommand;
})(exports.Commands || (exports.Commands = {}));
var Commands = exports.Commands;

var Runner;
(function (Runner) {
    function removeExtras(str) {
        var compressOutput = true;

        if (compressOutput) {
            return str.replace(/\[(INF|ERR|WRN)\][\s]+/g, '');
        } else {
            return str;
        }
    }

    function runScript(script, done, cwd) {
        var warning, error, options = {};

        if (cwd) {
            options.cwd = cwd;
        }

        log.debug('Running script: ' + script);

        var childProcess = cp.exec(script, options, function () {
        });

        childProcess.stdout.on('data', function (d) {
            var message = removeExtras(d);

            if (d.match(/^\[ERR\]/)) {
                error = error || message;
                log.error(message);
            } else if (d.match(/^\[WRN\]/)) {
                warning = warning || message;
                log.warn(message);
            } else {
                var dataLine = message.trim();

                if (dataLine) {
                    log.debug(dataLine);
                }
            }
        });

        childProcess.stderr.on('data', function (d) {
            log.error(removeExtras(d));
        });

        childProcess.on('exit', function (code) {
            if (error) {
                log.writeln();
                log.error(error + ' (see log for details)');
            }

            if (warning) {
                log.writeln();
                log.warn(warning + ' (see log for details)');
                log.writeln();
            }

            if (code !== 0) {
                log.error('Exited with code: %d.', code);

                return done(false);
            }

            done();
        });
    }
    Runner.runScript = runScript;
})(Runner || (Runner = {}));
