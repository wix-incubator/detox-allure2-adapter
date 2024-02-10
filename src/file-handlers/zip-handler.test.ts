import fs from 'node:fs';

// eslint-disable-next-line import/no-internal-modules
import type { FileAttachmentContext, FileAttachmentHandler } from 'jest-allure2-reporter/api';

import { createZipHandler } from './zip-handler';

describe('zip handler', () => {
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

    logHandler = createZipHandler({
      fileAttachmentHandlers: { move },
    } as any);
  });

  it('should zip a directory', async () => {
    const filePath = await logHandler({
      name: 'device.log',
      sourcePath: __dirname,
      mimeType: 'text/plain',
      outDir: __dirname,
    });

    expect(filePath).toBe(movedPath);
    expect(move).toHaveBeenCalledWith({
      name: 'device.log.zip',
      sourcePath: expect.stringMatching(/\.zip$/),
      mimeType: 'application/zip',
      outDir: __dirname,
    });
  });
});
