import { percent, percentVisible, truncate } from './utils';

describe('percent', () => {
  it('should return empty string for abnormal values', () => {
    expect(percent('')).toBe('');
    expect(percent(null)).toBe('');
    expect(percent()).toBe('');
    expect(percent(Number.NaN)).toBe('');
    expect(percent(Number.POSITIVE_INFINITY)).toBe('');
    expect(percent([])).toBe('');
    expect(percent({})).toBe('');
    expect(percent('')).toBe('');
  });

  it('should convert valid numbers to strings', () => {
    expect(percent(0.75)).toBe('75%');
    expect(percent(1)).toBe('100%');
    expect(percent(0)).toBe('0%');
    expect(percent(0.33)).toBe('33%');
  });

  it('should handle string numbers', () => {
    expect(percent('0.5')).toBe('50%');
    expect(percent('0')).toBe('0%');
    expect(percent('1')).toBe('100%');
  });
});

describe('percentVisible', () => {
  it('should return empty string for abnormal values', () => {
    expect(percentVisible('')).toBe('');
    expect(percentVisible(null)).toBe('');
    expect(percentVisible()).toBe('');
    expect(percentVisible(Number.NaN)).toBe('');
    expect(percentVisible(Number.POSITIVE_INFINITY)).toBe('');
    expect(percentVisible([])).toBe('');
    expect(percentVisible({})).toBe('');
    expect(percentVisible('')).toBe('');
  });

  it('should convert valid numbers to strings', () => {
    expect(percentVisible(75)).toBe('75%');
    expect(percentVisible(1)).toBe('1%');
    expect(percentVisible(100)).toBe('100%');
    expect(percentVisible(0)).toBe('0%');
    expect(percentVisible(33)).toBe('33%');
  });

  it('should handle string numbers', () => {
    expect(percentVisible('50')).toBe('50%');
    expect(percentVisible('0')).toBe('0%');
    expect(percentVisible('100')).toBe('100%');
    expect(percentVisible('1')).toBe('1%');
  });
});

describe('truncate', () => {
  it('should return empty string for falsy values', () => {
    expect(truncate('')).toBe('');
    expect(truncate(null)).toBe('');
    expect(truncate()).toBe('');
  });

  it('should not truncate strings shorter than MAX_LENGTH', () => {
    const shortString = 'Hello, World!';
    expect(truncate(shortString)).toBe(shortString);
  });

  it('should truncate long string with ellipsis in the middle', () => {
    const longString = '123456';
    const result = truncate(longString, 5);

    expect(result.length).toBe(5);
    expect(result).toBe('12…56');
  });

  it('should handle non-string values', () => {
    const number = 123_456_789_012_345;
    expect(truncate(number)).toBe('123456789012345');
  });

  it('should handle string exactly at MAX_LENGTH', () => {
    const exactString = '0'.repeat(40);
    expect(truncate(exactString)).toBe(exactString);
  });

  it('should split characters evenly with odd MAX_LENGTH - 1', () => {
    // MAX_LENGTH (30) - 1 for ellipsis = 29 chars to distribute
    // Should be split as 15 chars front, 14 chars back
    const longString = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789';
    const result = truncate(longString, 30);

    const frontPart = result.split('…')[0];
    const backPart = result.split('…')[1];

    expect(frontPart.length).toBe(15);
    expect(backPart.length).toBe(14);
    expect(result).toBe('ABCDEFGHIJKLMNO…VWXYZ123456789');
  });
});
