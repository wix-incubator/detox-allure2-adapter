import fs from 'node:fs';
import path from 'node:path';
// eslint-disable-next-line import/no-internal-modules
import type { FileAttachmentContext, FileAttachmentHandler } from 'jest-allure2-reporter/api';
import { createLogHandler } from './log-handler';

describe('log handler', () => {
  const movedPath = '/path/to/moved.log';

  let move: jest.Mock;
  let logHandler: FileAttachmentHandler;
  let temporaryFiles: string[];

  beforeAll(() => {
    temporaryFiles = [];
  });

  afterAll(() => {
    for (const file of temporaryFiles) {
      fs.unlinkSync(file);
    }
  });

  beforeEach(() => {
    move = jest.fn(async (context: FileAttachmentContext) => {
      temporaryFiles.push(context.sourcePath);
      return movedPath;
    });

    logHandler = createLogHandler({
      fileAttachmentHandlers: { move },
    } as any);
  });

  it.each([['ios.txt'], ['android.txt']])('should move a filtered copy of %s', async (inputLog) => {
    const filePath = await logHandler({
      name: 'device.log',
      sourcePath: path.join(__dirname, '__fixtures__', inputLog),
      mimeType: 'text/plain',
      outDir: __dirname,
    });

    expect(filePath).toBe(movedPath);
    expect(move).toBeCalledTimes(1);
    const filteredLogPath = move.mock.calls[0][0].sourcePath;
    const content = fs.readFileSync(filteredLogPath, 'utf8');
    expect(content).toMatchSnapshot();
  });
});
