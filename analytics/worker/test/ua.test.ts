import { describe, expect, it } from 'vitest';
import { classify } from '../src/ua';

const T = (ua: string) => classify(ua);

describe('classify (OPAWG data)', () => {
  it('Apple Podcasts', () => {
    expect(T('Podcasts/1410.53 CFNetwork/1111 Darwin/19.0.0 (x86_64)')).toMatchObject({ type: 'app', name: 'Apple Podcasts' });
  });
  it('Spotify', () => {
    expect(T('Spotify/8.7.10 iOS/15.3.1 (iPhone13,2)')).toMatchObject({ type: 'app', name: 'Spotify', device: 'mobile' });
  });
  it('Overcast', () => {
    expect(T('Overcast/3.0 (+http://overcast.fm/; iOS podcast app)')).toMatchObject({ type: 'app', name: 'Overcast' });
  });
  it('Pocket Casts', () => {
    expect(T('Pocket Casts')).toMatchObject({ type: 'app', name: 'Pocket Casts' });
  });
  it('YouTube Music and Amazon Music', () => {
    expect(T('com.google.android.apps.youtube.music/62354340 (Linux; U; Android 14; en_US; Pixel 7 Pro; Build/UP1A.231105.002; Cronet/114.0.5735.84)'))
      .toMatchObject({ type: 'app', name: 'YouTube Music' });
    expect(T('AmazonMusic')).toMatchObject({ type: 'app', name: 'Amazon Music' });
  });
  it('bots win over later lists and have no device', () => {
    expect(T('7Siters/1.1 (+https://7ooo.ru/siters/)')).toMatchObject({ type: 'bot', name: '7Siters Crawler', device: 'unknown' });
  });
  it('apps with a HomePod UA get a device category', () => {
    expect(T('AirPodcasts/4022.700.8 CFNetwork/1410.0.3 Darwin/22.6.0').device).toBe('smart_speaker');
  });
  it('libraries and unknown', () => {
    expect(T('Python/3.10 aiohttp/3.8.1').type).toBe('library');
    expect(T('totally-unknown-agent/9').type).toBe('unknown');
    expect(T('')).toEqual({ type: 'unknown', name: 'Unknown', device: 'unknown' });
  });
  it('browsers', () => {
    expect(T('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36').type).toBe('browser');
  });
  it('memoizes', () => {
    expect(T('Pocket Casts')).toBe(T('Pocket Casts'));
  });
});
