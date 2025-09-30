import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// eslint-disable-next-line import/no-internal-modules
import type { FileAttachmentContext, FileAttachmentHandler } from 'jest-allure2-reporter/api';

import { RecycleBin } from './RecycleBin';
import { createZipHandler, createZipRmHandler } from './zip-handler';

describe('zip handlers', () => {
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
  });

  describe('zip handler', () => {
    beforeEach(() => {
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

  describe('zip-rm handler', () => {
    let zipRmHandler: FileAttachmentHandler;
    let onError: jest.Mock;
    let tempDir: string;

    beforeEach(() => {
      onError = jest.fn();
      RecycleBin.instance(onError);
      zipRmHandler = createZipRmHandler({
        fileAttachmentHandlers: { move },
      } as any);
    });

    it('should zip a directory and remove the original', async () => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'zip-rm-test-'));
      const testFile = path.join(tempDir, 'test.txt');
      fs.writeFileSync(testFile, 'Hello, world!');
      const subDir = path.join(tempDir, 'subdir');
      fs.mkdirSync(subDir);
      fs.writeFileSync(path.join(subDir, 'nested.txt'), 'Nested content');

      expect(fs.existsSync(tempDir)).toBe(true);

      const filePath = await zipRmHandler({
        name: 'test-directory',
        sourcePath: tempDir,
        mimeType: 'text/plain',
        outDir: __dirname,
      });

      expect(filePath).toBe(movedPath);
      expect(move).toHaveBeenCalledWith({
        name: 'test-directory.zip',
        sourcePath: expect.stringMatching(/\.zip$/),
        mimeType: 'application/zip',
        outDir: __dirname,
      });

      expect(fs.existsSync(tempDir)).toBe(true);

      await RecycleBin.instance().clear();
      expect(fs.existsSync(tempDir)).toBe(false);
      expect(onError).not.toHaveBeenCalled();
    });
  });
});
