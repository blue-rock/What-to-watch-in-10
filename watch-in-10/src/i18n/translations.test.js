import { describe, it, expect } from 'vitest';
import { translations } from './translations';

describe('translations', () => {
  const locales = Object.keys(translations);

  it('has all four supported locales', () => {
    expect(locales).toContain('en');
    expect(locales).toContain('hi');
    expect(locales).toContain('es');
    expect(locales).toContain('fr');
  });

  it('English has all required keys', () => {
    const en = translations.en;
    const requiredKeys = [
      'header.title1', 'header.title2', 'header.subtitle',
      'search.placeholder', 'search.button',
      'room.watchRoom', 'room.chat', 'room.chatSend',
      'results.share', 'results.refresh',
      'channel.viewChannel',
    ];
    for (const key of requiredKeys) {
      expect(en[key], `Missing key: ${key}`).toBeDefined();
    }
  });

  it('all locales have chat translation keys', () => {
    const chatKeys = ['room.chat', 'room.chatEmpty', 'room.chatPlaceholder', 'room.chatSend'];
    for (const locale of locales) {
      for (const key of chatKeys) {
        expect(translations[locale][key], `${locale} missing ${key}`).toBeDefined();
      }
    }
  });

  it('all locales have shared control translation keys', () => {
    const keys = ['room.sharedControlOn', 'room.sharedControlOff', 'room.sharedControlActive'];
    for (const locale of locales) {
      for (const key of keys) {
        expect(translations[locale][key], `${locale} missing ${key}`).toBeDefined();
      }
    }
  });

  it('all locales have video call (Meet) translation keys', () => {
    const keys = ['room.videoCall', 'room.startMeet', 'room.joinMeet', 'room.endMeet', 'room.meetPlaceholder', 'room.meetShare', 'room.noMeet'];
    for (const locale of locales) {
      for (const key of keys) {
        expect(translations[locale][key], `${locale} missing ${key}`).toBeDefined();
      }
    }
  });

  it('no translation values are empty strings', () => {
    for (const locale of locales) {
      for (const [key, val] of Object.entries(translations[locale])) {
        expect(val.length, `${locale}.${key} is empty`).toBeGreaterThan(0);
      }
    }
  });
});
