import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

// eslint-disable-next-line import/no-internal-modules
import type { AllureRuntime } from 'jest-allure2-reporter/api';

import type { DeviceWrapper } from '../utils';

import { VideoManager } from './manager';

const mockStop = jest.fn<Promise<string | undefined>, []>();

jest.mock('videokitten', () => ({
  videokitten: () => ({ startRecording: async () => ({ stop: mockStop }) }),
}));

describe('VideoManager', () => {
  let temporaryDirectory: string;
  let videoPath: string;
  let manager: VideoManager;

  beforeEach(async () => {
    temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'video-manager-'));
    videoPath = path.join(temporaryDirectory, 'video.mp4');
    await fs.writeFile(videoPath, '');
    mockStop.mockResolvedValue(videoPath);

    manager = new VideoManager({
      device: { platform: 'ios', id: 'simulator-id' } as DeviceWrapper,
      options: true,
      onError: jest.fn(),
    });
    await manager.ensureRecording();
  });

  afterEach(async () => {
    mockStop.mockReset();
    await fs.rm(temporaryDirectory, { recursive: true, force: true });
  });

  it('waits for the video attachment before resolving on failure', async () => {
    let finishAttachment!: () => void;
    const fileAttachment = jest.fn(
      () =>
        new Promise<string | undefined>((resolve) => {
          finishAttachment = () => resolve(videoPath);
        }),
    );
    const allure = { fileAttachment } as unknown as AllureRuntime;

    let settled = false;
    const done = manager.stopAndAttach(allure, true).then(() => {
      settled = true;
    });
    await new Promise(setImmediate);

    expect(fileAttachment).toHaveBeenCalledWith(videoPath, { name: 'test.mp4', handler: 'move' });
    expect(settled).toBe(false);

    finishAttachment();
    await done;
    expect(settled).toBe(true);
  });

  it('deletes the video without attaching it when the test passed', async () => {
    const fileAttachment = jest.fn();
    const allure = { fileAttachment } as unknown as AllureRuntime;

    await manager.stopAndAttach(allure, false);

    expect(fileAttachment).not.toHaveBeenCalled();
    await expect(fs.access(videoPath)).rejects.toThrow();
  });

  it('deletes the video when there is no allure runtime', async () => {
    await manager.stopAndAttach(undefined, true);

    await expect(fs.access(videoPath)).rejects.toThrow();
  });

  it('does not reject when the video attachment fails', async () => {
    const fileAttachment = jest.fn().mockRejectedValue(new Error('attachment failed'));
    const allure = { fileAttachment } as unknown as AllureRuntime;

    await expect(manager.stopAndAttach(allure, true)).resolves.toBeUndefined();
  });
});
