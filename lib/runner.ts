/// <reference path="../node.d.ts" />
/// <reference path="../byline.d.ts" />

import cp = require('child_process');
import events = require('events');
import path = require('path');
import stream = require('stream');
import byline = require('byline');

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
        run(cwd?: string): events.EventEmitter;
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

        run(cwd?: string): events.EventEmitter {
            var cmd = path.join(path.normalize(this.sencha), 'sencha'),
                emitter = new events.EventEmitter(),
                runnerOpts = {
                    treatWarningsAsErrors: false
                };

            Runner.runScript([cmd, this.toString()].join(' '), runnerOpts, emitter, cwd);

            return emitter;
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

    function removeExtras(str: string) {
        var compressOutput = true;

        if (compressOutput) {
            return str.replace(/\[(INF|ERR|WRN)\][\s]+/g, '');
        } else {
            return str;
        }
    }

    export function runScript(script: string, opts: { treatWarningsAsErrors: boolean }, emitter: events.EventEmitter, cwd?: string): void {
        var warning: string,
            error: string,
            options: Options = {},
            stdout: stream.Readable,
            stderr: stream.Readable;

        if (cwd) {
            options.cwd = cwd;
        }

        emitter.emit('data', 'Running script: ' + script);

        var childProcess = cp.exec(script, options, () => {});

        stdout = byline.createStream(childProcess.stdout, { keepEmptyLines: true });
        stderr = byline.createStream(childProcess.stderr, { keepEmptyLines: true });

        stdout.on('data', function (d: string) {
            var message = removeExtras (d);

            if (d.match(/^\[ERR\]/)) {
                error = error || message;
                emitter.emit('data', message);
            } else if (d.match(/^\[WRN\]/)) {
                warning = warning || message;
                emitter.emit('data', message);
            } else {
                var dataLine = message.trim();

                if (dataLine) {
                    emitter.emit('data', dataLine);
                }
            }
        });

        stderr.on('data', (d: string) => {
            emitter.emit('error', removeExtras(d));
        });

        childProcess.on('exit', (code: number) => {
            if (error) {
                emitter.emit('end', error);
            } else if (warning && opts.treatWarningsAsErrors) {
                emitter.emit('end', warning);
            } else if (code !== 0 && code !== null) {
                // Sencha CMD sometimes does not provide exit code when there are "only" warnings
                emitter.emit('end', 'Exited with code: ' + code + '.');
            } else {
                emitter.emit('end', null);
            }
        });
    }
}
