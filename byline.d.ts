declare module 'byline' {
    import stream = require('stream');

    interface Options {
        keepEmptyLines?: boolean;
    }

    export function createStream(stream: stream.Readable, options?: Options): stream.Readable;
}