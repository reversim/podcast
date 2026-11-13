import { describe, it, expect } from 'vitest';
import { formatDuration, formatTime, parseChapters, parseTime, parseTranscript, plainDescription, transcriptToVtt } from '../episode';

describe('time helpers', () => {
  it('parses MM:SS and H:MM:SS', () => {
    expect(parseTime('01:51')).toBe(111);
    expect(parseTime('1:02:03')).toBe(3723);
    expect(parseTime('abc')).toBeNaN();
  });
  it('formats times', () => {
    expect(formatTime(111)).toBe('01:51');
    expect(formatTime(3723)).toBe('1:02:03');
    expect(formatDuration(2460)).toBe('00:41:00');
  });
});

describe('parseChapters', () => {
  const body = 'intro\n\n**[01:51] רקע**\n\n* bullet [02:00]\n\n**[04:12] [Lusha](https://lusha.com) והצורך**\n';
  it('reads bold timestamp headings and adds a chapter at 0', () => {
    expect(parseChapters(body)).toEqual([
      { startTime: 0, title: 'פתיחה' },
      { startTime: 111, title: 'רקע' },
      { startTime: 252, title: 'Lusha והצורך' },
    ]);
  });
  it('returns nothing when the times do not increase', () => {
    expect(parseChapters('**[05:00] a**\n**[04:00] b**\n**[06:00] c**')).toEqual([]);
  });
  it('returns nothing for a post with no chapters', () => {
    expect(parseChapters('<p>old blogger post</p>')).toEqual([]);
  });
});

describe('transcripts', () => {
  const raw = '[00:00] **רן**: שלום\nהמשך השורה\n\n[00:11] **אורי**: היי <b>\nnoise\n[1:00:05] **רן**: סוף';
  const lines = parseTranscript(raw);
  it('parses lines, speakers and continuation lines', () => {
    expect(lines).toHaveLength(3);
    expect(lines[0]).toEqual({ start: 0, speaker: 'רן', text: 'שלום המשך השורה' });
    expect(lines[2].start).toBe(3605);
  });
  it('writes WebVTT with voice tags and escaped text', () => {
    const vtt = transcriptToVtt(lines, 3610);
    expect(vtt.startsWith('WEBVTT\n')).toBe(true);
    expect(vtt).toContain('00:00:00.000 --> 00:00:11.000\n<v רן>שלום המשך השורה');
    expect(vtt).toContain('<v אורי>היי &lt;b&gt; noise');
    expect(vtt).toContain('01:00:05.000 --> 01:00:10.000');
  });
});

describe('plainDescription', () => {
  it('removes Markdown and HTML and cuts at a word', () => {
    const d = plainDescription('**שלום** [עולם](https://x.y) <b>טוב</b> ' + 'מילה '.repeat(80), 60);
    expect(d.startsWith('שלום עולם טוב מילה')).toBe(true);
    expect(d.length).toBeLessThanOrEqual(61);
    expect(d.endsWith('…')).toBe(true);
  });
});
