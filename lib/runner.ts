/// <reference path="../node.d.ts" />

import cp = require('child_process');
import path = require('path');

module log {
    enum Level {
        debug = 0,
        warning = 1,
        error = 2
    }

    export function writeln(): void {
        console.log('\n');
    }

    export function error(msg: string, ...args: any[]): void {
        log(Level.error, msg, args);
    }

    export function debug(msg: string, ...args: any[]): void {
        log(Level.debug, msg, args);
    }

    export function warn(msg: string, ...args: any[]): void {
        log(Level.warning, msg, args);
    }

    function log(level: Level, msg: string, args: any[]): void {
        if (args && args.length > 0) {
            console.log.apply(null, [].concat(msg, args));
        } else {
            console.log(msg);
        }
    }
}

export interface factory {
    (sencha: string, cmd: 'which'): Commands.WhichCommand;
    (sencha: string, cmd: 'compile'): Commands.CompileCommand;
    (sencha: string, cmd: string): Commands.ICommand;
}

export var cmd: factory = function (sencha: string, cmd: string): any {
    switch (cmd) {
        case 'compile':
            return new Commands.CompileCommand(sencha);
        case 'which':
            return new Commands.WhichCommand(sencha);
        default:
            return new Commands.Command(sencha, cmd);
    }
};

export module Commands {
    export interface ICommand {
        run(done: () => void): void;
    }

    export class Command implements ICommand {
        private cmd: string[];

        constructor(private sencha: string, cmd: string = '') {
            this.cmd = [cmd];
        }

        append(cmd: string): void;
        append(cmd: string[]): void;
        append(cmd: string, options: string[]): void;
        append(...cmd: string[]): void;
        append(): void {
            var args: any[] = Array.prototype.slice.call(arguments),
                cmd = args.shift(),
                options = args.shift();

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
        }

        run(done: () => void): void {
            var cmd = path.join(path.normalize(this.sencha), 'sencha');

            Runner.runScript([cmd, this.toString()].join(' '), () => {
                done();
            });
        }

        toString(): string {
            return this.cmd.join(' ');
        }
    }

    export class WhichCommand extends Command {
        constructor(sencha?: string) {
            super(sencha, 'which');
        }
    }

    export class CompileCommand extends Command {
        private a: string;

        constructor(sencha?: string) {
            super(sencha, 'compile');

            this.a = '';
        }

        option(name: string, value?: string): CompileCommand {
            if (name.search(/^-.*/gi) === -1) {
                name = '-' + name;
            }

            this.append(name, value || '');

            return this;
        }

        and(): string {
            var and = this.a;

            this.a = 'and ';

            return and;
        }

        union(...args: string[]): CompileCommand {
            this.append(this.and() + 'union', args);

            return this;
        }

        include(...args: string[]): CompileCommand {
            this.append(this.and() + 'include', args);

            return this;
        }

        exclude(...args: string[]): CompileCommand {
            this.append(this.and() + 'exclude', args);

            return this;
        }

        meta(output?: string): CompileCommand {
            this.append(this.and() + 'meta');

            if (output) {
                this.option('output-file', output);
            }

            return this;
        }

        concatenate(output?: string): CompileCommand {
            this.append(this.and() + 'concatenate');

            if (output) {
                this.option('output-file', output);
            }

            return this;
        }
    }
}

module Runner {
    export interface Options {
        cwd?: string;
        stdio?: any;
        customFds?: any;
        env?: any;
        encoding?: string;
        timeout?: number;
        maxBuffer?: number;
        killSignal?: string;
    }

    function removeExtras(str) {
        var compressOutput = true;

        if (compressOutput) {
            return str.replace(/\[(INF|ERR|WRN)\][\s]+/g, '');
        } else {
            return str;
        }
    }

    export function runScript(script: string, done: (success?: boolean) => void, cwd?: string): void {
        var warning,
            error,
            options: Options = {};

        if (cwd) {
            options.cwd = cwd;
        }

        log.debug('Running script: ' + script);

        var childProcess = cp.exec(script, options, () => {});

        childProcess.stdout.on('data', function (d) {
            var message = removeExtras (d);

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

        childProcess.stderr.on('data', (d) => {
            log.error(removeExtras(d));
        });

        childProcess.on('exit', (code) => {
            if (error) {
                log.writeln(); // write new line to gap from previous output
                log.error(error + ' (see log for details)');
            }

            if (warning) {
                log.writeln(); // write new line to gap from previous output
                log.warn(warning + ' (see log for details)');
                log.writeln(); // write new line to gap from previous output
            }

            if (code !== 0) {
                log.error('Exited with code: %d.', code);

                return done(false);
            }

            done();
        });
    }
}
