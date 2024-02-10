/* eslint-disable unicorn/no-array-method-this-argument */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';

// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntimePluginContext, FileAttachmentHandler } from 'jest-allure2-reporter/api';

const WHITESPACE_START = /^\s+/;

export function createLogHandler(pluginContext: AllureRuntimePluginContext): FileAttachmentHandler {
  return async function logHandler(context) {
    return pluginContext.fileAttachmentHandlers.move({
      ...context,
      sourcePath: await filterLog(context.sourcePath),
    });
  };
}

async function filterLog(src: string): Promise<string> {
  const seed = crypto.randomBytes(8).toString('hex');
  const dest = path.join(os.tmpdir(), 'detox-allure2-filtered-' + seed + '.log');
  const onError = (error: Error) => console.error('Caught error in detox-allure2-adapter:', error);

  await doFilterLog({
    input: fs.createReadStream(src).on('error', onError),
    output: fs.createWriteStream(dest).on('error', onError),
    include: ['Detox', 'ReactNativeJS', 'com.facebook.react.log', /\s[EF]\s/],
    exclude: ['com.apple.network', '(CFNetwork)'],
    transform: (s) => s.replace(/^\S*\s*/, ''),
  });

  return dest;
}

type FilterLogParams = {
  input: fs.ReadStream;
  output: fs.WriteStream;
  include: (string | RegExp)[];
  exclude: (string | RegExp)[];
  transform: (line: string) => string;
};

async function doFilterLog({ input, output, include, exclude, transform }: FilterLogParams) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input });

    let shouldPrint = false;
    rl.on('line', (input) => {
      const isWhitespace = WHITESPACE_START.test(input);
      shouldPrint = isWhitespace
        ? shouldPrint
        : include.some(test, input) && !exclude.some(test, input);

      const line = isWhitespace ? input : transform(input);

      if (shouldPrint) {
        output.write(line + '\n');
      }
    });

    rl.on('close', resolve);
  });
}

function test(this: string, pattern: string | RegExp) {
  return typeof pattern === 'string' ? this.includes(pattern) : pattern.test(this);
}
