import { describe, expect, it } from 'vitest';
import { embeddedUrl, isEmbedded, otherDevice, phoneOrientation, profileOf, settingKey } from './device';

describe('Demo device', () => {
  it('knows the page in the phone frame by its parameter', () => {
    expect(isEmbedded('?embed=1')).toBe(true);
    expect(isEmbedded('')).toBe(false);
    expect(isEmbedded('?embed=0')).toBe(false);
  });

  it('keeps the path of the page in the address of the frame', () => {
    expect(embeddedUrl('/world-of-evolving-paths/')).toBe('/world-of-evolving-paths/?embed=1');
  });

  it('runs time bottom to top on an upright phone and left to right on one on its side', () => {
    expect(phoneOrientation({ width: 375, height: 812 })).toBe('vertical-inverted');
    expect(phoneOrientation({ width: 812, height: 375 })).toBe('horizontal');
  });

  it('uses the phone settings on a narrow page and in the phone frame', () => {
    expect(profileOf(false, false)).toBe('desktop');
    expect(profileOf(false, true)).toBe('mobile');
    expect(profileOf(true, false)).toBe('mobile');
  });

  it('keeps the plain keys for the desktop and separate ones for the phone', () => {
    expect(settingKey('desktop', 'docks')).toBe('wep-demo:docks');
    expect(settingKey('mobile', 'docks')).toBe('wep-demo:mobile:docks');
  });

  it('switches between the two devices', () => {
    expect(otherDevice('desktop')).toBe('mobile');
    expect(otherDevice('mobile')).toBe('desktop');
  });
});
