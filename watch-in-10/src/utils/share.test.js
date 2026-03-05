import { describe, it, expect, vi, beforeEach } from 'vitest';
import { copyVideoLink, shareNative } from './share';

const mockVideo = {
  title: 'Test Video',
  url: 'https://www.youtube.com/watch?v=abc123',
};

describe('copyVideoLink', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('copies video URL to clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const result = await copyVideoLink(mockVideo);
    expect(writeText).toHaveBeenCalledWith(mockVideo.url);
    expect(result).toBe(true);
  });

  it('returns false on clipboard failure', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });

    const result = await copyVideoLink(mockVideo);
    expect(result).toBe(false);
  });
});

describe('shareNative', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when navigator.share is not available', async () => {
    Object.defineProperty(navigator, 'share', { value: undefined, writable: true, configurable: true });
    const result = await shareNative(mockVideo);
    expect(result).toBe(false);
  });

  it('calls navigator.share with correct data', async () => {
    const shareFn = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: shareFn, writable: true, configurable: true });

    const result = await shareNative(mockVideo);
    expect(shareFn).toHaveBeenCalledWith({
      title: mockVideo.title,
      text: `Watch: ${mockVideo.title}`,
      url: mockVideo.url,
    });
    expect(result).toBe(true);
  });
});
